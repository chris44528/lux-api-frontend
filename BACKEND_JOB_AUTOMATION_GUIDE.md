# Backend Job Automation Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the job automation system in your Django backend.

## 1. Settings Configuration

Add to your Django `settings.py`:

```python
# Job Automation Settings
JOB_AUTOMATION = {
    'NO_COMS': {
        'enabled': True,
        'days_threshold': 3,  # No readings for X days
        'job_type_id': 'no_coms',
        'check_duplicate': True
    },
    'ZERO_READS': {
        'enabled': True,
        'days_to_check': 4,  # Check last X days
        'readings_to_compare': 3,  # Compare last X readings
        'job_type_id': 'zero_reads',
        'check_duplicate': True
    }
}

# Cron job timing (if using django-crontab)
CRONJOBS = [
    ('0 6 * * *', 'your_app.management.commands.run_daily_job_automation.Command.handle'),
]
```

## 2. Database Models

Ensure you have these models or adjust according to your schema:

```python
# models.py
class Site(models.Model):
    site_id = models.CharField(max_length=50, unique=True)
    site_name = models.CharField(max_length=200)
    # ... other fields

class Reading(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    reading_date = models.DateTimeField()
    reading_value = models.DecimalField(max_digits=10, decimal_places=2)
    # ... other fields
    
    class Meta:
        indexes = [
            models.Index(fields=['site', '-reading_date']),
        ]

class Job(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    job_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    # ... other fields
```

## 3. Management Commands

### A. No Coms Job Creation

Create `management/commands/create_no_coms_jobs.py`:

```python
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from your_app.models import Site, Reading, Job

class Command(BaseCommand):
    help = 'Create jobs for sites with no communication'

    def handle(self, *args, **options):
        config = settings.JOB_AUTOMATION['NO_COMS']
        
        if not config['enabled']:
            self.stdout.write('No Coms job creation is disabled')
            return
        
        days_threshold = config['days_threshold']
        cutoff_date = timezone.now() - timedelta(days=days_threshold)
        
        # Find sites with no recent readings
        sites_with_recent_readings = Reading.objects.filter(
            reading_date__gte=cutoff_date
        ).values_list('site_id', flat=True).distinct()
        
        sites_without_readings = Site.objects.exclude(
            id__in=sites_with_recent_readings
        )
        
        jobs_created = 0
        
        for site in sites_without_readings:
            # Check for duplicate if enabled
            if config['check_duplicate']:
                existing_job = Job.objects.filter(
                    site=site,
                    job_type=config['job_type_id'],
                    status='open'
                ).exists()
                
                if existing_job:
                    continue
            
            # Create the job
            Job.objects.create(
                site=site,
                job_type=config['job_type_id'],
                status='open',
                description=f'No readings for {days_threshold} days'
            )
            jobs_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Created {jobs_created} No Coms jobs')
        )
```

### B. Zero Reads Job Creation

Create `management/commands/create_zero_reads_jobs.py`:

```python
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.db.models import F, Window
from django.db.models.functions import Lag
from your_app.models import Site, Reading, Job

class Command(BaseCommand):
    help = 'Create jobs for sites with zero generation increase'

    def handle(self, *args, **options):
        config = settings.JOB_AUTOMATION['ZERO_READS']
        
        if not config['enabled']:
            self.stdout.write('Zero Reads job creation is disabled')
            return
        
        days_to_check = config['days_to_check']
        readings_to_compare = config['readings_to_compare']
        
        # Get all sites
        sites = Site.objects.all()
        jobs_created = 0
        
        for site in sites:
            # Get recent readings with lag calculation
            recent_readings = Reading.objects.filter(
                site=site
            ).order_by('-reading_date')[:readings_to_compare + 1]
            
            if len(recent_readings) < readings_to_compare:
                continue
            
            # Calculate differences
            zero_count = 0
            for i in range(len(recent_readings) - 1):
                diff = recent_readings[i].reading_value - recent_readings[i + 1].reading_value
                if diff == 0:
                    zero_count += 1
            
            # Check if we have enough consecutive zero differences
            if zero_count >= days_to_check:
                # Check for duplicate if enabled
                if config['check_duplicate']:
                    existing_job = Job.objects.filter(
                        site=site,
                        job_type=config['job_type_id'],
                        status='open'
                    ).exists()
                    
                    if existing_job:
                        continue
                
                # Create the job
                Job.objects.create(
                    site=site,
                    job_type=config['job_type_id'],
                    status='open',
                    description=f'No generation increase for {zero_count} days'
                )
                jobs_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Created {jobs_created} Zero Reads jobs')
        )
```

### C. Combined Daily Runner

Create `management/commands/run_daily_job_automation.py`:

```python
from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Run all job automation tasks'

    def handle(self, *args, **options):
        self.stdout.write('Starting daily job automation...')
        
        # Run No Coms job creation
        try:
            call_command('create_no_coms_jobs')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'No Coms job creation failed: {e}')
            )
        
        # Run Zero Reads job creation
        try:
            call_command('create_zero_reads_jobs')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Zero Reads job creation failed: {e}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('Daily job automation completed')
        )
```

## 4. API Views

Create `views/job_automation.py`:

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.core.management import call_command
from django.db.models import Count, Q
from datetime import datetime, timedelta
from your_app.models import Job

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_automation_settings(request):
    """Get current job automation settings"""
    return Response(settings.JOB_AUTOMATION)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_automation_settings(request):
    """Update job automation settings"""
    # In production, you'd want to store these in database
    # For now, return success but note settings are read-only
    return Response({
        'message': 'Settings updated successfully',
        'note': 'Settings persistence requires database implementation'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_manual_automation(request):
    """Manually trigger job automation"""
    try:
        # Get initial job count
        initial_count = Job.objects.filter(
            job_type__in=['no_coms', 'zero_reads'],
            created_at__date=datetime.now().date()
        ).count()
        
        # Run automation
        call_command('run_daily_job_automation')
        
        # Get new job count
        final_count = Job.objects.filter(
            job_type__in=['no_coms', 'zero_reads'],
            created_at__date=datetime.now().date()
        ).count()
        
        return Response({
            'success': True,
            'created_jobs': final_count - initial_count
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_automation_dashboard(request):
    """Get dashboard data for job automation"""
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    
    # Summary stats
    summary = {
        'total_no_coms': Job.objects.filter(
            job_type='no_coms',
            status='open'
        ).count(),
        'total_zero_reads': Job.objects.filter(
            job_type='zero_reads',
            status='open'
        ).count(),
        'jobs_created_today': Job.objects.filter(
            job_type__in=['no_coms', 'zero_reads'],
            created_at__date=today
        ).count(),
        'jobs_created_week': Job.objects.filter(
            job_type__in=['no_coms', 'zero_reads'],
            created_at__date__gte=week_ago
        ).count(),
        'last_run': Job.objects.filter(
            job_type__in=['no_coms', 'zero_reads']
        ).order_by('-created_at').first().created_at if Job.objects.exists() else None
    }
    
    # Recent jobs
    recent_jobs = []
    for job in Job.objects.filter(
        job_type__in=['no_coms', 'zero_reads']
    ).select_related('site').order_by('-created_at')[:20]:
        recent_jobs.append({
            'id': job.id,
            'site_id': job.site.site_id,
            'site_name': job.site.site_name,
            'job_type': job.job_type,
            'created_at': job.created_at,
            'status': job.status
        })
    
    # Daily stats for chart
    daily_stats = []
    for i in range(7):
        date = today - timedelta(days=i)
        stats = Job.objects.filter(
            created_at__date=date,
            job_type__in=['no_coms', 'zero_reads']
        ).aggregate(
            no_coms=Count('id', filter=Q(job_type='no_coms')),
            zero_reads=Count('id', filter=Q(job_type='zero_reads'))
        )
        daily_stats.append({
            'date': date.strftime('%d/%m'),
            'no_coms': stats['no_coms'],
            'zero_reads': stats['zero_reads']
        })
    
    daily_stats.reverse()
    
    return Response({
        'summary': summary,
        'recent_jobs': recent_jobs,
        'daily_stats': daily_stats
    })
```

## 5. URL Configuration

Add to your `urls.py`:

```python
from django.urls import path
from your_app.views import job_automation

urlpatterns = [
    # ... other urls
    path('api/job-automation/settings/', job_automation.get_automation_settings),
    path('api/job-automation/settings/', job_automation.update_automation_settings),
    path('api/job-automation/run-manual/', job_automation.run_manual_automation),
    path('api/job-automation/dashboard/', job_automation.get_automation_dashboard),
]
```

## 6. Cron Setup

For production, set up a cron job to run daily:

```bash
# Using crontab
0 6 * * * cd /path/to/project && python manage.py run_daily_job_automation

# Or using django-crontab
pip install django-crontab
# Add to INSTALLED_APPS and configure CRONJOBS in settings.py
python manage.py crontab add
```

## 7. Testing

Test your implementation:

```bash
# Test individual commands
python manage.py create_no_coms_jobs
python manage.py create_zero_reads_jobs
python manage.py run_daily_job_automation

# Test API endpoints
curl -X GET http://localhost:8000/api/job-automation/settings/
curl -X POST http://localhost:8000/api/job-automation/run-manual/
```

## 8. Monitoring & Logging

Add logging to track automation:

```python
import logging
logger = logging.getLogger('job_automation')

# In your commands
logger.info(f'Created {jobs_created} No Coms jobs')
logger.error(f'Failed to create job: {e}')
```

## Notes

1. **Performance**: Add database indexes on frequently queried fields
2. **Scalability**: Consider using Celery for async job creation
3. **Monitoring**: Set up alerts for automation failures
4. **Settings Storage**: Consider storing settings in database for dynamic updates
5. **Time Zones**: Ensure proper timezone handling for readings