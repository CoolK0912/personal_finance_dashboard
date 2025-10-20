from django.urls import path, include
from . import views

app_name = 'transaction'

urlpatterns = [
    path('add_transaction/', views.add_transaction, name='add_transaction'),
    path('view_transactions/', views.view_transactions, name='view_transactions'),
    path('delete_transaction/<int:transaction_id>/', views.delete_transaction, name='delete_transaction'),
    path('transactions/', views.transaction_list, name='transaction_list'),
    path('transactions/<int:pk>/', views.transaction_detail, name='transaction_detail'),
    # Add more URL patterns here
]