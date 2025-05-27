# Backend UI Permissions Implementation Guide

## Overview
This guide provides detailed implementation requirements for enhancing the backend UI permissions system to support granular frontend control.

## 1. Database Schema Enhancements

### 1.1 Add Audit Logging Table
```python
# apps/users/models.py

class UIPermissionAuditLog(models.Model):
    """Track all permission changes for compliance and debugging"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permission_changes')
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    permission = models.ForeignKey('UIPermission', on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=[
        ('granted', 'Granted'),
        ('revoked', 'Revoked'),
        ('bulk_update', 'Bulk Update'),
        ('copied', 'Copied from Another Group')
    ])
    previous_state = models.BooleanField(null=True)
    new_state = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['group', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['permission', 'timestamp']),
        ]

class UIPermissionTemplate(models.Model):
    """Pre-configured permission sets for common roles"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    permissions = models.JSONField(default=dict)  # {codename: is_granted}
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
```

### 1.2 Enhance UIPermission Model
```python
# Add to existing UIPermission model
class UIPermission(models.Model):
    # ... existing fields ...
    
    # New fields
    category = models.CharField(max_length=50, choices=[
        ('navigation', 'Navigation'),
        ('actions', 'Actions'),
        ('fields', 'Fields'),
        ('tabs', 'Tabs'),
        ('buttons', 'Buttons'),
        ('widgets', 'Widgets'),
        ('settings', 'Settings'),
    ], null=True, blank=True)
    
    risk_level = models.CharField(max_length=20, choices=[
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('critical', 'Critical'),
    ], default='low')
    
    requires_mfa = models.BooleanField(default=False)
    requires_approval = models.BooleanField(default=False)
    
    # Dependencies
    depends_on = models.ManyToManyField('self', symmetrical=False, related_name='dependents', blank=True)
    
    # Metadata
    deprecated = models.BooleanField(default=False)
    deprecated_message = models.TextField(null=True, blank=True)
    replacement_permission = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
```

## 2. API Enhancements

### 2.1 Bulk Permission Check Endpoint
```python
# apps/users/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
import hashlib

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_permissions_bulk(request):
    """
    Check multiple permissions in a single request
    
    Request body:
    {
        "codenames": ["sites.list.view", "sites.detail.edit"],
        "check_all": false  // If true, returns true only if user has ALL permissions
    }
    """
    codenames = request.data.get('codenames', [])
    check_all = request.data.get('check_all', False)
    
    # Generate cache key based on user and permissions
    cache_key = f"bulk_perms:{request.user.id}:{hashlib.md5(':'.join(sorted(codenames)).encode()).hexdigest()}"
    
    # Check cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return Response(cached_result)
    
    # Get user's permissions
    user_permissions = UIPermissionCache.get_user_permissions(request.user)
    
    # Check each permission
    results = {}
    for codename in codenames:
        results[codename] = user_permissions.get(codename, False)
    
    # Calculate aggregate result
    if check_all:
        has_all = all(results.values())
        response_data = {
            'has_all': has_all,
            'permissions': results
        }
    else:
        has_any = any(results.values())
        response_data = {
            'has_any': has_any,
            'permissions': results
        }
    
    # Cache for 5 minutes
    cache.set(cache_key, response_data, 300)
    
    return Response(response_data)
```

### 2.2 Permission Dependencies Endpoint
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_permission_dependencies(request, codename):
    """Get all permissions that depend on or are dependencies of a permission"""
    try:
        permission = UIPermission.objects.get(codename=codename)
    except UIPermission.DoesNotExist:
        return Response({'error': 'Permission not found'}, status=404)
    
    dependencies = {
        'depends_on': [
            {
                'codename': p.codename,
                'name': p.name,
                'is_granted': UIPermissionCache.has_permission(request.user, p.codename)
            }
            for p in permission.depends_on.all()
        ],
        'required_by': [
            {
                'codename': p.codename,
                'name': p.name,
                'is_granted': UIPermissionCache.has_permission(request.user, p.codename)
            }
            for p in permission.dependents.all()
        ]
    }
    
    return Response(dependencies)
```

### 2.3 Permission Templates Endpoints
```python
class UIPermissionTemplateViewSet(viewsets.ModelViewSet):
    """Manage permission templates"""
    queryset = UIPermissionTemplate.objects.all()
    serializer_class = UIPermissionTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def apply_to_group(self, request, pk=None):
        """Apply a template to a group"""
        template = self.get_object()
        group_id = request.data.get('group_id')
        
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=404)
        
        # Apply template permissions
        applied_count = 0
        for codename, is_granted in template.permissions.items():
            try:
                permission = UIPermission.objects.get(codename=codename)
                GroupUIPermission.objects.update_or_create(
                    group=group,
                    permission=permission,
                    defaults={'is_granted': is_granted}
                )
                applied_count += 1
            except UIPermission.DoesNotExist:
                continue
        
        # Log the action
        UIPermissionAuditLog.objects.create(
            user=request.user,
            group=group,
            permission=None,
            action='bulk_update',
            notes=f'Applied template "{template.name}" with {applied_count} permissions',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        
        # Clear cache
        UIPermissionCache.clear_group_cache(group)
        
        return Response({
            'message': f'Applied {applied_count} permissions from template',
            'template': template.name,
            'group': group.name
        })
```

### 2.4 Real-time Permission Updates via WebSocket
```python
# apps/users/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class PermissionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return
            
        # Join user-specific group
        self.user_group = f"permissions_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )
    
    async def permission_update(self, event):
        """Send permission update to client"""
        await self.send(text_data=json.dumps({
            'type': 'permission_update',
            'permissions': event['permissions'],
            'timestamp': event['timestamp']
        }))

# Signal to notify permission changes
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@receiver([post_save, post_delete], sender=GroupUIPermission)
def notify_permission_change(sender, instance, **kwargs):
    """Notify users when their permissions change"""
    channel_layer = get_channel_layer()
    group = instance.group
    
    # Get all users in the group
    users = User.objects.filter(groups=group)
    
    for user in users:
        # Send update to user's channel
        async_to_sync(channel_layer.group_send)(
            f"permissions_{user.id}",
            {
                'type': 'permission_update',
                'permissions': UIPermissionCache.get_user_permissions(user),
                'timestamp': timezone.now().isoformat()
            }
        )
```

## 3. Enhanced Permission Seeding

### 3.1 Comprehensive Permission Structure
```python
# management/commands/seed_ui_permissions_enhanced.py

from django.core.management.base import BaseCommand
from apps.users.models import UIPermission

class Command(BaseCommand):
    help = 'Seed comprehensive UI permissions'
    
    def handle(self, *args, **options):
        permissions = [
            # Site Module Permissions
            {
                'module': 'sites',
                'permissions': [
                    # Module access
                    ('sites.module.root', 'Sites Module', 'Access to sites module', 'navigation', 'low'),
                    
                    # List view
                    ('sites.list.view', 'View Site List', 'Can view list of sites', 'navigation', 'low'),
                    ('sites.list.add_button', 'Add Site Button', 'Show add site button', 'buttons', 'medium'),
                    ('sites.list.export_button', 'Export Sites Button', 'Show export button', 'buttons', 'low'),
                    ('sites.list.bulk_actions', 'Bulk Actions', 'Can perform bulk actions', 'actions', 'medium'),
                    ('sites.list.delete_action', 'Delete Sites', 'Can delete sites', 'actions', 'high'),
                    ('sites.list.filter_advanced', 'Advanced Filters', 'Access advanced filtering', 'actions', 'low'),
                    
                    # Detail view
                    ('sites.detail.view', 'View Site Details', 'Can view site details', 'navigation', 'low'),
                    ('sites.detail.edit', 'Edit Site', 'Can edit site information', 'actions', 'medium'),
                    
                    # Tabs
                    ('sites.detail.tabs.overview', 'Overview Tab', 'View overview tab', 'tabs', 'low'),
                    ('sites.detail.tabs.meters', 'Meters Tab', 'View meters tab', 'tabs', 'low'),
                    ('sites.detail.tabs.readings', 'Readings Tab', 'View readings tab', 'tabs', 'low'),
                    ('sites.detail.tabs.jobs', 'Jobs Tab', 'View jobs tab', 'tabs', 'low'),
                    ('sites.detail.tabs.calls', 'Calls Tab', 'View calls tab', 'tabs', 'low'),
                    ('sites.detail.tabs.alerts', 'Alerts Tab', 'View alerts tab', 'tabs', 'low'),
                    ('sites.detail.tabs.history', 'History Tab', 'View history tab', 'tabs', 'low'),
                    
                    # Actions
                    ('sites.detail.actions.test_meter', 'Test Meter', 'Can test meter', 'actions', 'medium', True),
                    ('sites.detail.actions.change_meter', 'Change Meter', 'Can change meter', 'actions', 'high', True),
                    ('sites.detail.actions.change_sim', 'Change SIM', 'Can change SIM card', 'actions', 'high', True),
                    ('sites.detail.actions.add_note', 'Add Note', 'Can add notes', 'actions', 'low'),
                    ('sites.detail.actions.create_job', 'Create Job', 'Can create jobs', 'actions', 'medium'),
                    ('sites.detail.actions.export', 'Export Site', 'Can export site data', 'actions', 'low'),
                    ('sites.detail.actions.monitoring', 'Advanced Monitoring', 'Access monitoring', 'actions', 'medium'),
                    ('sites.detail.actions.alerts', 'Manage Alerts', 'Can manage alerts', 'actions', 'medium'),
                    ('sites.detail.actions.compare', 'Compare Readings', 'Can compare readings', 'actions', 'low'),
                    ('sites.detail.actions.text_landlord', 'Text Landlord', 'Can send SMS', 'actions', 'medium'),
                    
                    # Fields
                    ('sites.detail.fields.account_number', 'Account Number', 'View account number', 'fields', 'medium'),
                    ('sites.detail.fields.meter_serial', 'Meter Serial', 'View meter serial', 'fields', 'low'),
                    ('sites.detail.fields.consumption', 'Consumption Data', 'View consumption', 'fields', 'low'),
                    ('sites.detail.fields.billing', 'Billing Info', 'View billing info', 'fields', 'high'),
                    ('sites.detail.fields.landlord_contact', 'Landlord Contact', 'View landlord info', 'fields', 'medium'),
                    ('sites.detail.fields.notes', 'Site Notes', 'View site notes', 'fields', 'low'),
                    ('sites.detail.fields.sensitive', 'Sensitive Data', 'View sensitive data', 'fields', 'critical', True),
                ]
            },
            
            # Jobs Module
            {
                'module': 'jobs',
                'permissions': [
                    ('jobs.module.root', 'Jobs Module', 'Access to jobs module', 'navigation', 'low'),
                    ('jobs.list.view', 'View Job List', 'Can view job list', 'navigation', 'low'),
                    ('jobs.list.create_button', 'Create Job Button', 'Show create job button', 'buttons', 'medium'),
                    ('jobs.list.bulk_assign', 'Bulk Assign', 'Can bulk assign jobs', 'actions', 'medium'),
                    ('jobs.detail.view', 'View Job Details', 'Can view job details', 'navigation', 'low'),
                    ('jobs.detail.edit', 'Edit Job', 'Can edit job', 'actions', 'medium'),
                    ('jobs.detail.complete', 'Complete Job', 'Can complete job', 'actions', 'medium'),
                    ('jobs.detail.cancel', 'Cancel Job', 'Can cancel job', 'actions', 'high'),
                    ('jobs.board.drag_drop', 'Drag & Drop Jobs', 'Can drag and drop on board', 'actions', 'medium'),
                ]
            },
            
            # Reports Module
            {
                'module': 'reports',
                'permissions': [
                    ('reports.module.root', 'Reports Module', 'Access to reports', 'navigation', 'low'),
                    ('reports.rdg.view', 'View RDG Report', 'Can view RDG reports', 'navigation', 'medium'),
                    ('reports.rdg.export', 'Export RDG Report', 'Can export RDG', 'actions', 'medium'),
                    ('reports.analysis.view', 'View Analysis', 'Can view analysis', 'navigation', 'low'),
                    ('reports.analysis.advanced', 'Advanced Analysis', 'Advanced analysis tools', 'actions', 'high'),
                    ('reports.fco.view', 'View FCO Report', 'Can view FCO reports', 'navigation', 'medium'),
                    ('reports.custom.create', 'Create Custom Reports', 'Can create reports', 'actions', 'high'),
                ]
            },
            
            # Settings Module
            {
                'module': 'settings',
                'permissions': [
                    ('settings.module.root', 'Settings Module', 'Access settings', 'navigation', 'high'),
                    ('settings.users.view', 'View Users', 'Can view users', 'navigation', 'high'),
                    ('settings.users.create', 'Create Users', 'Can create users', 'actions', 'critical', True),
                    ('settings.users.edit', 'Edit Users', 'Can edit users', 'actions', 'critical', True),
                    ('settings.users.delete', 'Delete Users', 'Can delete users', 'actions', 'critical', True),
                    ('settings.users.reset_password', 'Reset Passwords', 'Can reset passwords', 'actions', 'critical', True),
                    ('settings.groups.view', 'View Groups', 'Can view groups', 'navigation', 'high'),
                    ('settings.groups.manage', 'Manage Groups', 'Can manage groups', 'actions', 'critical', True),
                    ('settings.permissions.view', 'View Permissions', 'Can view permissions', 'navigation', 'high'),
                    ('settings.permissions.manage', 'Manage Permissions', 'Can manage permissions', 'actions', 'critical', True),
                    ('settings.ui_permissions.view', 'View UI Permissions', 'Can view UI permissions', 'navigation', 'high'),
                    ('settings.ui_permissions.manage', 'Manage UI Permissions', 'Can manage UI permissions', 'actions', 'critical', True),
                ]
            },
            
            # Dashboard Module
            {
                'module': 'dashboard',
                'permissions': [
                    ('dashboard.module.root', 'Dashboard Module', 'Access dashboard', 'navigation', 'low'),
                    ('dashboard.widgets.sites_summary', 'Sites Summary Widget', 'View sites summary', 'widgets', 'low'),
                    ('dashboard.widgets.jobs_overview', 'Jobs Overview Widget', 'View jobs overview', 'widgets', 'low'),
                    ('dashboard.widgets.alerts', 'Alerts Widget', 'View alerts widget', 'widgets', 'low'),
                    ('dashboard.widgets.performance', 'Performance Widget', 'View performance', 'widgets', 'medium'),
                    ('dashboard.widgets.financial', 'Financial Widget', 'View financial data', 'widgets', 'high'),
                    ('dashboard.customize', 'Customize Dashboard', 'Can customize dashboard', 'actions', 'low'),
                ]
            }
        ]
        
        # Create permissions
        for module_data in permissions:
            module = module_data['module']
            for perm_data in module_data['permissions']:
                codename, name, description, category, risk_level = perm_data[:5]
                requires_mfa = perm_data[5] if len(perm_data) > 5 else False
                
                UIPermission.objects.update_or_create(
                    codename=codename,
                    defaults={
                        'name': name,
                        'description': description,
                        'module': module,
                        'category': category,
                        'risk_level': risk_level,
                        'requires_mfa': requires_mfa,
                    }
                )
                
        # Set up dependencies
        dependencies = [
            ('sites.detail.view', ['sites.list.view']),
            ('sites.detail.edit', ['sites.detail.view']),
            ('sites.detail.actions.test_meter', ['sites.detail.view', 'sites.detail.tabs.meters']),
            ('sites.detail.actions.change_meter', ['sites.detail.edit', 'sites.detail.tabs.meters']),
            ('jobs.detail.edit', ['jobs.detail.view']),
            ('jobs.detail.complete', ['jobs.detail.edit']),
            ('settings.users.edit', ['settings.users.view']),
            ('settings.groups.manage', ['settings.groups.view']),
            ('settings.permissions.manage', ['settings.permissions.view']),
        ]
        
        for codename, deps in dependencies:
            try:
                permission = UIPermission.objects.get(codename=codename)
                for dep_codename in deps:
                    dep_permission = UIPermission.objects.get(codename=dep_codename)
                    permission.depends_on.add(dep_permission)
            except UIPermission.DoesNotExist:
                continue
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded UI permissions'))
```

## 4. Performance Optimizations

### 4.1 Redis Caching Implementation
```python
# apps/users/cache.py

import json
from django.core.cache import cache
from django.conf import settings
import redis

class UIPermissionRedisCache:
    def __init__(self):
        self.redis_client = redis.StrictRedis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_PERMISSIONS_DB,
            decode_responses=True
        )
        self.ttl = 3600  # 1 hour
    
    def get_user_permissions(self, user_id):
        """Get user permissions from Redis"""
        key = f"ui_perms:user:{user_id}"
        data = self.redis_client.get(key)
        if data:
            return json.loads(data)
        return None
    
    def set_user_permissions(self, user_id, permissions):
        """Cache user permissions in Redis"""
        key = f"ui_perms:user:{user_id}"
        self.redis_client.setex(key, self.ttl, json.dumps(permissions))
    
    def invalidate_user(self, user_id):
        """Invalidate user's permission cache"""
        key = f"ui_perms:user:{user_id}"
        self.redis_client.delete(key)
    
    def invalidate_group(self, group_id):
        """Invalidate all users in a group"""
        from django.contrib.auth.models import User
        users = User.objects.filter(groups__id=group_id)
        
        pipe = self.redis_client.pipeline()
        for user in users:
            key = f"ui_perms:user:{user.id}"
            pipe.delete(key)
        pipe.execute()
    
    def warmup_cache(self, user_ids=None):
        """Pre-warm cache for active users"""
        from django.contrib.auth.models import User
        
        if user_ids is None:
            # Get recently active users
            users = User.objects.filter(
                last_login__isnull=False
            ).order_by('-last_login')[:100]
        else:
            users = User.objects.filter(id__in=user_ids)
        
        for user in users:
            permissions = UIPermissionCache.get_user_permissions(user)
            self.set_user_permissions(user.id, permissions)

# Initialize Redis cache
redis_permission_cache = UIPermissionRedisCache()
```

### 4.2 Database Query Optimization
```python
# apps/users/managers.py

from django.db import models

class UIPermissionQuerySet(models.QuerySet):
    def with_user_status(self, user):
        """Annotate permissions with user's grant status"""
        from django.db.models import Exists, OuterRef, Q
        
        user_groups = user.groups.all()
        
        return self.annotate(
            is_granted=Exists(
                GroupUIPermission.objects.filter(
                    permission=OuterRef('pk'),
                    group__in=user_groups,
                    is_granted=True
                )
            )
        )
    
    def accessible_by_user(self, user):
        """Get only permissions accessible by user"""
        user_groups = user.groups.all()
        
        granted_permissions = GroupUIPermission.objects.filter(
            group__in=user_groups,
            is_granted=True
        ).values_list('permission_id', flat=True)
        
        return self.filter(id__in=granted_permissions)

class UIPermissionManager(models.Manager):
    def get_queryset(self):
        return UIPermissionQuerySet(self.model, using=self._db)
    
    def get_tree_for_user(self, user):
        """Get permission tree with user's access status"""
        return self.get_queryset().with_user_status(user).select_related(
            'parent'
        ).prefetch_related(
            'depends_on',
            'dependents'
        )
```

## 5. Security Enhancements

### 5.1 MFA Check for High-Risk Permissions
```python
# apps/users/decorators.py

from functools import wraps
from django.http import JsonResponse

def require_mfa_for_permission(permission_codename):
    """Decorator to require MFA for specific permissions"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Check if permission requires MFA
            try:
                permission = UIPermission.objects.get(codename=permission_codename)
                if permission.requires_mfa:
                    # Check if user has verified MFA recently
                    mfa_verified_at = request.session.get('mfa_verified_at')
                    if not mfa_verified_at or (
                        timezone.now() - datetime.fromisoformat(mfa_verified_at)
                    ).seconds > 900:  # 15 minutes
                        return JsonResponse({
                            'error': 'MFA verification required',
                            'mfa_required': True
                        }, status=403)
            except UIPermission.DoesNotExist:
                pass
            
            return view_func(request, *args, **kwargs)
        return wrapped_view
    return decorator
```

### 5.2 Rate Limiting for Permission Checks
```python
# apps/users/middleware.py

from django.core.cache import cache
from django.http import JsonResponse
import time

class PermissionRateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limit = 1000  # requests per minute
        self.window = 60  # seconds
    
    def __call__(self, request):
        if request.path.startswith('/api/v1/users/ui-permissions/'):
            # Rate limit permission checks
            user_id = request.user.id if request.user.is_authenticated else 'anonymous'
            key = f'perm_rate:{user_id}'
            
            current_count = cache.get(key, 0)
            if current_count >= self.rate_limit:
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'retry_after': self.window
                }, status=429)
            
            cache.set(key, current_count + 1, self.window)
        
        response = self.get_response(request)
        return response
```

## 6. Monitoring and Analytics

### 6.1 Permission Usage Analytics
```python
# apps/users/analytics.py

from django.db import models
from django.contrib.postgres.fields import JSONField

class PermissionUsageLog(models.Model):
    """Track permission usage for analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission = models.ForeignKey(UIPermission, on_delete=models.CASCADE)
    accessed_at = models.DateTimeField(auto_now_add=True)
    granted = models.BooleanField()
    context = JSONField(default=dict)  # Additional context
    
    class Meta:
        indexes = [
            models.Index(fields=['permission', 'accessed_at']),
            models.Index(fields=['user', 'accessed_at']),
        ]

# Celery task for analytics
from celery import shared_task

@shared_task
def analyze_permission_usage():
    """Generate permission usage reports"""
    from django.db.models import Count, Q
    from datetime import timedelta
    
    # Get usage stats for last 30 days
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    stats = PermissionUsageLog.objects.filter(
        accessed_at__range=[start_date, end_date]
    ).values('permission__codename').annotate(
        total_checks=Count('id'),
        granted_count=Count('id', filter=Q(granted=True)),
        denied_count=Count('id', filter=Q(granted=False))
    ).order_by('-total_checks')
    
    # Store results for dashboard
    cache.set('permission_usage_stats', list(stats), 3600)
    
    return stats
```

## 7. API Documentation

### 7.1 OpenAPI Schema
```yaml
# apps/users/openapi_schemas.py

ui_permissions_schema = {
    '/api/v1/users/ui-permissions/my-permissions/': {
        'get': {
            'summary': 'Get current user UI permissions',
            'responses': {
                '200': {
                    'description': 'User permissions',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'permissions': {
                                        'type': 'object',
                                        'additionalProperties': {'type': 'boolean'}
                                    },
                                    'groups': {
                                        'type': 'array',
                                        'items': {'type': 'string'}
                                    },
                                    'cached_at': {'type': 'string', 'format': 'date-time'}
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/v1/users/ui-permissions/check-bulk/': {
        'post': {
            'summary': 'Check multiple permissions',
            'requestBody': {
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'codenames': {
                                    'type': 'array',
                                    'items': {'type': 'string'}
                                },
                                'check_all': {'type': 'boolean', 'default': False}
                            }
                        }
                    }
                }
            }
        }
    }
}
```

## 8. Migration Script

### 8.1 Migrate Existing Menu Permissions
```python
# management/commands/migrate_menu_to_ui_permissions.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.users.models import UIPermission, GroupUIPermission

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Mapping of old menu permissions to new UI permissions
        menu_to_ui_mapping = {
            'dashboard': ['dashboard.module.root', 'dashboard.widgets.sites_summary'],
            'sites': ['sites.module.root', 'sites.list.view'],
            'jobs': ['jobs.module.root', 'jobs.list.view'],
            'reports': ['reports.module.root'],
            'settings': ['settings.module.root'],
        }
        
        # Get all groups
        for group in Group.objects.all():
            # Get existing menu permissions
            menu_perms = MenuPermission.objects.filter(group=group)
            
            for menu_perm in menu_perms:
                if menu_perm.menu_item in menu_to_ui_mapping:
                    # Grant corresponding UI permissions
                    ui_codenames = menu_to_ui_mapping[menu_perm.menu_item]
                    
                    for codename in ui_codenames:
                        try:
                            ui_perm = UIPermission.objects.get(codename=codename)
                            GroupUIPermission.objects.update_or_create(
                                group=group,
                                permission=ui_perm,
                                defaults={'is_granted': menu_perm.has_access}
                            )
                        except UIPermission.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(f'Permission {codename} not found')
                            )
            
        self.stdout.write(self.style.SUCCESS('Migration completed'))
```

## 9. Testing

### 9.1 Unit Tests
```python
# tests/test_ui_permissions.py

from django.test import TestCase
from django.contrib.auth.models import User, Group
from apps.users.models import UIPermission, GroupUIPermission

class UIPermissionTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser')
        self.group = Group.objects.create(name='Test Group')
        self.user.groups.add(self.group)
        
        self.permission = UIPermission.objects.create(
            codename='test.action',
            name='Test Action',
            module='test'
        )
    
    def test_permission_grant(self):
        """Test granting permissions"""
        GroupUIPermission.objects.create(
            group=self.group,
            permission=self.permission,
            is_granted=True
        )
        
        has_perm = UIPermissionCache.has_permission(self.user, 'test.action')
        self.assertTrue(has_perm)
    
    def test_hierarchical_permissions(self):
        """Test parent-child permission inheritance"""
        parent = UIPermission.objects.create(
            codename='test.module',
            name='Test Module',
            module='test'
        )
        
        GroupUIPermission.objects.create(
            group=self.group,
            permission=parent,
            is_granted=True
        )
        
        # Child permission should inherit
        has_perm = UIPermissionCache.has_permission(self.user, 'test.module.child')
        self.assertTrue(has_perm)
    
    def test_permission_dependencies(self):
        """Test permission dependencies"""
        dep_permission = UIPermission.objects.create(
            codename='test.dependency',
            name='Test Dependency',
            module='test'
        )
        
        self.permission.depends_on.add(dep_permission)
        
        # Should not have permission without dependency
        GroupUIPermission.objects.create(
            group=self.group,
            permission=self.permission,
            is_granted=True
        )
        
        has_perm = UIPermissionCache.has_permission(
            self.user, 'test.action', check_dependencies=True
        )
        self.assertFalse(has_perm)
```

## 10. Deployment Checklist

1. **Database Migrations**
   ```bash
   python manage.py makemigrations users
   python manage.py migrate users
   ```

2. **Seed Permissions**
   ```bash
   python manage.py seed_ui_permissions_enhanced
   ```

3. **Migrate Existing Permissions**
   ```bash
   python manage.py migrate_menu_to_ui_permissions
   ```

4. **Configure Redis**
   ```python
   # settings.py
   REDIS_PERMISSIONS_DB = 2
   CACHES['ui_permissions'] = {
       'BACKEND': 'django_redis.cache.RedisCache',
       'LOCATION': f'redis://127.0.0.1:6379/{REDIS_PERMISSIONS_DB}',
       'OPTIONS': {
           'CLIENT_CLASS': 'django_redis.client.DefaultClient',
       }
   }
   ```

5. **Add Middleware**
   ```python
   MIDDLEWARE = [
       # ... other middleware
       'apps.users.middleware.PermissionRateLimitMiddleware',
   ]
   ```

6. **Configure WebSockets** (if using real-time updates)
   ```python
   # routing.py
   from apps.users.consumers import PermissionConsumer
   
   websocket_urlpatterns = [
       path('ws/permissions/', PermissionConsumer.as_asgi()),
   ]
   ```

7. **Set up Celery Tasks**
   ```python
   # celery.py
   from celery.schedules import crontab
   
   app.conf.beat_schedule = {
       'analyze-permission-usage': {
           'task': 'apps.users.analytics.analyze_permission_usage',
           'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
       },
   }
   ```

8. **Monitor Performance**
   - Set up alerts for high permission check rates
   - Monitor Redis memory usage
   - Track API response times

This comprehensive backend implementation provides all the necessary infrastructure for a robust, scalable, and secure UI permissions system.