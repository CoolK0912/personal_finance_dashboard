from django.urls import path
from . import views
app_name = 'budget'

path('view_budgets/', views.view_budgets, name='view_budgets'),
path('add_budget/', views.add_budget, name='add_budget'),
path('delete_budget/<int:budget_id>/', views.delete_budget, name='delete_budget'),
path('update_budget/<int:budget_id>/', views.update_budget, name='update_budget'),