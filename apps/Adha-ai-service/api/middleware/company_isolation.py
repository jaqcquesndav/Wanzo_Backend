"""
Middleware for ensuring company data isolation.
"""
from django.http import HttpResponseForbidden
from django.urls import resolve
from django.contrib.auth.models import User
from api.models import JournalEntry, ChatConversation, Company


class CompanyIsolationMiddleware:
    """
    Middleware that ensures users can only access data belonging to their company.
    This is used to ensure proper data isolation in the API.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Process the request
        response = self.get_response(request)
        return response
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Called just before the view is called.
        Returns None to continue processing or an HttpResponse to stop.
        """
        # Skip isolation checks if user is not authenticated
        if not request.user.is_authenticated:
            return None
            
        # Get the resolved URL name
        resolved = resolve(request.path_info)
        url_name = resolved.url_name if hasattr(resolved, 'url_name') else None
        
        # Check for company-specific resource access
        resource_id = None
        resource_type = None
        
        # Handle journal entry access
        if 'journal_entry_id' in view_kwargs:
            resource_id = view_kwargs['journal_entry_id']
            resource_type = 'journal_entry'
        
        # Handle conversation access
        if 'conversation_id' in view_kwargs:
            resource_id = view_kwargs['conversation_id']
            resource_type = 'conversation'
        
        # Skip if no resource is being accessed
        if not resource_id or not resource_type:
            return None
            
        # Perform the isolation check
        if resource_type == 'journal_entry':
            if not self._can_access_journal_entry(request.user, resource_id):
                return HttpResponseForbidden("Access denied: You cannot access journal entries from other companies.")
        
        elif resource_type == 'conversation':
            if not self._can_access_conversation(request.user, resource_id):
                return HttpResponseForbidden("Access denied: You cannot access conversations from other users.")
        
        return None
    
    def _can_access_journal_entry(self, user, entry_id):
        """
        Check if the user can access the specified journal entry.
        A user can access an entry if:
        1. They created it
        2. It belongs to their company (created by another user in the same company)
        3. They are an admin (but only for their own company)
        """
        try:
            entry = JournalEntry.objects.get(id=entry_id)
            
            # If the user created this entry
            if entry.created_by == user:
                return True
            
            # Check if user and entry creator are in the same company
            user_companies = user.companies.all() if hasattr(user, 'companies') else []
            
            if entry.created_by and hasattr(entry.created_by, 'companies'):
                entry_creator_companies = entry.created_by.companies.all()
                
                # Check for company overlap
                for user_company in user_companies:
                    if user_company in entry_creator_companies:
                        return True
                        
            # Admin users can only access entries from their company
            if user.is_staff:
                # Need to check if entry creator is in admin's company
                if not entry.created_by:
                    # If no creator is associated, deny access to be safe
                    return False
                    
                # Get admin's company
                admin_companies = user.companies.all()
                creator_companies = entry.created_by.companies.all() if hasattr(entry.created_by, 'companies') else []
                
                # Check for company overlap
                for admin_company in admin_companies:
                    if admin_company in creator_companies:
                        return True
            
            return False
            
        except JournalEntry.DoesNotExist:
            return False
    
    def _can_access_conversation(self, user, conversation_id):
        """
        Check if the user can access the specified conversation.
        A user can only access their own conversations, regardless of admin status.
        """
        try:
            conversation = ChatConversation.objects.get(conversation_id=conversation_id)
            
            # Users can only access their own conversations
            return conversation.user == user
            
        except ChatConversation.DoesNotExist:
            return False
