from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

app_name = 'account'

router = DefaultRouter()
router.register(r"accounts", views.AccountViewSet, basename = 'account')

urlpatterns = [
    path("", include(router.urls)),
]
