from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

app_name = 'budget'

router = DefaultRouter()
router.register(r"budgets", views.BudgetViewSet, basename = 'budget')

urlpatterns = [
    path("", include(router.urls)),
]