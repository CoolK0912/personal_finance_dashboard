from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

app_name = 'transaction'

router = DefaultRouter()
router.register(r"transactions", views.TransactionViewSet, basename = "transaction")
router.register(r"users", views.UserViewSet, basename = "user")


urlpatterns = [
    path("", include(router.urls)),
]