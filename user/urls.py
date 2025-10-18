from django.urls import path, include
from . import views
app_name = 'user'

path('user_profile/<int:user_id>/', views.user_profile, name='user_profile'),
path('balance_summary/', views.balance_summary, name='balance_summary'),