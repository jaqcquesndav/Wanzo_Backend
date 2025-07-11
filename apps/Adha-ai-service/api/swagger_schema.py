from drf_yasg.inspectors import SwaggerAutoSchema
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

class CustomSwaggerAutoSchema(SwaggerAutoSchema):
    """
    Custom Swagger schema class to handle file uploads properly
    """
    def get_file_fields(self, serializer):
        """
        Extracts FileFields from the serializer to handle them separately
        """
        file_fields = []
        for field_name, field in serializer.fields.items():
            if field.__class__.__name__ == 'FileField':
                file_fields.append((field_name, field))
        return file_fields

    def get_operation(self, operation_keys=None):
        """
        Override to handle FileFields differently
        """
        operation = super().get_operation(operation_keys)
        
        # If this is a multipart form data request
        consumes = self.get_consumes()
        if 'multipart/form-data' in consumes:
            # Check if view has serializer_class with FileFields
            if hasattr(self.view, 'serializer_class'):
                serializer = self.view.serializer_class()
                file_fields = self.get_file_fields(serializer)
                
                # Modify parameters for FileFields
                if file_fields and 'parameters' in operation:
                    # Remove the original body parameter if it exists
                    operation['parameters'] = [p for p in operation['parameters'] if p['in'] != 'body']
                    
                    # Add file parameters as formData
                    for field_name, field in file_fields:
                        param = {
                            'name': field_name,
                            'in': 'formData',
                            'description': field.help_text or '',
                            'required': field.required,
                            'type': 'file'
                        }
                        operation['parameters'].append(param)
        
        return operation

class CustomAdminSwaggerAutoSchema(SwaggerAutoSchema):
    """
    Custom Swagger schema generator for Admin endpoints.
    """
    def get_tags(self, operation_keys=None):
        # Add 'Admin' prefix to all admin endpoint tags
        tags = super().get_tags(operation_keys)
        if tags:
            # Check if this is already tagged as admin
            if not any(tag.startswith('Admin:') for tag in tags):
                return ['Admin: ' + tags[0]]
        return ['Admin']

class CustomCompanySwaggerAutoSchema(SwaggerAutoSchema):
    """
    Custom Swagger schema generator for Company endpoints.
    """
    def get_tags(self, operation_keys=None):
        # Add 'Company' prefix to all company endpoint tags
        tags = super().get_tags(operation_keys)
        if tags:
            # Check if this is already tagged as company
            if not any(tag.startswith('Company:') for tag in tags):
                return ['Company: ' + tags[0]]
        return ['Company']

def admin_api_view(description=""):
    """
    Decorator for admin API views to ensure correct Swagger documentation.
    """
    def decorator(func):
        return swagger_auto_schema(
            auto_schema=CustomAdminSwaggerAutoSchema,
            operation_description=description,
        )(func)
    return decorator

def company_api_view(description=""):
    """
    Decorator for company API views to ensure correct Swagger documentation.
    """
    def decorator(func):
        return swagger_auto_schema(
            auto_schema=CustomCompanySwaggerAutoSchema,
            operation_description=description,
        )(func)
    return decorator
