from django.urls import path, include
from . import views
from rest_framework.urlpatterns import format_suffix_patterns

app_name = 'transaction'

urlpatterns = [
    path('transactions/', views.TransactionList.as_view()),
    path('transactions/<int:pk>/', views.TransactionDetail.as_view()),
    # Add more URL patterns here
]
urlpatterns = format_suffix_patterns(urlpatterns)