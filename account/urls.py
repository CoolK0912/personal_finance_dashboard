from django.urls import path, include
from . import views
app_name = 'account'

path('view_accounts/', views.view_accounts, name='view_accounts'),
path('add_account/', views.add_account, name='add_account'),
path('delete_account/<int:account_id>/', views.delete_account, name='delete_account'),
