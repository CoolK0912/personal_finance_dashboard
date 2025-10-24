from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

app_name = 'category'

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename = 'category')

urlpatterns = [
    path("", include(router.urls)),
]