from rest_framework import serializers
from django.contrib.auth.models import User
from .models import JournalEntry, ChatConversation, ChatMessage, UserProfile, Company

class AccountingEntryDetailSerializer(serializers.Serializer):
    compte = serializers.CharField(help_text="Numéro de compte SYSCOHADA")
    montant = serializers.DecimalField(max_digits=15, decimal_places=2)
    libelle = serializers.CharField()

class AccountingEntrySerializer(serializers.Serializer):
    debit = AccountingEntryDetailSerializer(many=True)
    credit = AccountingEntryDetailSerializer(many=True)
    date = serializers.DateField()
    piece_reference = serializers.CharField()
    description = serializers.CharField()

class JournalEntrySerializer(serializers.ModelSerializer):
    debit = serializers.JSONField(source='debit_data')
    credit = serializers.JSONField(source='credit_data')
    company_name = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = ['id', 'date', 'piece_reference', 'description', 'debit', 'credit', 'company_name']
        ref_name = 'JournalEntry'
        read_only_fields = ['id', 'created_at', 'updated_at', 'company_name']
    
    def validate(self, data):
        """
        Valide que les écritures sont équilibrées (total débit = total crédit).
        """
        debit_data = data.get('debit_data', [])
        credit_data = data.get('credit_data', [])
        
        total_debit = sum(item.get('montant', 0) for item in debit_data)
        total_credit = sum(item.get('montant', 0) for item in credit_data)
        
        if abs(total_debit - total_credit) > 0.01:
            raise serializers.ValidationError(
                f"L'écriture comptable n'est pas équilibrée: débit={total_debit}, crédit={total_credit}"
            )
        
        return data
    
    def get_company_name(self, obj):
        # Get company name from user profile
        if obj.created_by and hasattr(obj.created_by, 'profile'):
            return obj.created_by.profile.company_name
        return None

class VerificationResultSerializer(serializers.Serializer):
    is_coherent = serializers.BooleanField()
    is_compliant = serializers.BooleanField()
    errors = serializers.ListField(child=serializers.CharField(), required=False)
    warnings = serializers.ListField(child=serializers.CharField(), required=False)
    has_forced_balance = serializers.BooleanField(required=False, default=False)

class DocumentAnalysisResponseSerializer(serializers.Serializer):
    entries = JournalEntrySerializer(many=True)
    verification = VerificationResultSerializer()
    details = serializers.DictField(required=False)

class ChatRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(help_text="Question ou instruction en langage naturel")
    conversation_id = serializers.UUIDField(required=False, allow_null=True, 
                                          help_text="ID de conversation pour conserver le contexte")
    company_context = serializers.JSONField(required=False, allow_null=True,
                                          help_text="Contexte de l'entreprise pour cette conversation")

class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField(help_text="Réponse en langage naturel")
    conversation_id = serializers.UUIDField(help_text="Identifiant de la conversation")
    message_id = serializers.UUIDField(help_text="Identifiant du message")
    relevant_entries = serializers.ListField(child=serializers.DictField(), 
                                           help_text="Écritures comptables pertinentes",
                                           required=False)
    conversation_context = serializers.ListField(
        child=serializers.DictField(),
        help_text="Résumé de la conversation pour le contexte",
        required=False
    )
    user_info = serializers.DictField(help_text="Informations sur l'utilisateur", required=False)

class AccountMovementSerializer(serializers.Serializer):
    date = serializers.DateField()
    description = serializers.CharField()
    debit = serializers.DecimalField(max_digits=15, decimal_places=2)
    credit = serializers.DecimalField(max_digits=15, decimal_places=2)
    entry_id = serializers.CharField()

class AccountingSummarySerializer(serializers.Serializer):
    account = serializers.CharField()
    total_debit = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_credit = serializers.DecimalField(max_digits=15, decimal_places=2)
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    movements = AccountMovementSerializer(many=True)
    entry_count = serializers.IntegerField()

class BatchDocumentRequestSerializer(serializers.Serializer):
    files = serializers.FileField(
        help_text="Fichier à traiter (utilisez plusieurs requêtes pour plusieurs fichiers)",
        required=True
    )
    intention = serializers.CharField(required=False, help_text="Type de traitement souhaité")

class TokenUsageDetailSerializer(serializers.Serializer):
    input_tokens = serializers.IntegerField()
    output_tokens = serializers.IntegerField()
    total_tokens = serializers.IntegerField()
    token_limit = serializers.IntegerField(allow_null=True)
    session_duration = serializers.FloatField()

class TokenUsagePerAgentSerializer(serializers.Serializer):
    input_tokens = serializers.IntegerField()
    output_tokens = serializers.IntegerField()
    total_tokens = serializers.IntegerField()
    operations = serializers.IntegerField()
    models_used = serializers.ListField(child=serializers.CharField())

class TokenUsageSerializer(serializers.Serializer):
    total = TokenUsageDetailSerializer()
    per_agent = serializers.DictField(child=TokenUsagePerAgentSerializer())

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['company_name', 'company_type', 'sector', 'phone_number', 
                 'address', 'subscription_plan', 'subscription_status']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'profile', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class CompanySerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    employees_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = ['id', 'name', 'registration_number', 'vat_number', 'address', 
                 'city', 'postal_code', 'country', 'phone', 'email', 'website',
                 'owner', 'owner_details', 'employees_count', 'is_active', 
                 'created_at', 'industry', 'isolation_remaining']
        read_only_fields = ['created_at', 'owner_details', 'employees_count']
    
    def get_employees_count(self, obj):
        return obj.employees.count()

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['message_id', 'is_user', 'content', 'timestamp', 'relevant_entries']
        read_only_fields = ['message_id', 'timestamp']

class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    company_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = ['conversation_id', 'title', 'created_at', 'updated_at', 
                 'company_context', 'is_archived', 'messages', 'company_name']
        read_only_fields = ['conversation_id', 'created_at', 'updated_at', 'company_name']
    
    def get_company_name(self, obj):
        # Get company name from company context or user profile
        if 'company_name' in obj.company_context:
            return obj.company_context['company_name']
        elif hasattr(obj.user, 'profile'):
            return obj.user.profile.company_name
        return None