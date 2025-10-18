from django.shortcuts import render
from http import HttpResponse
from django.contrib.auth.models import User
# Create your views here.

def view_categories(request):
    # Logic to view categories would go here
    return HttpResponse("Hello, this is the view_categories view.")

def add_category(request):
    # Logic to add a category would go here
    return HttpResponse("Hello, this is the add_category view.")

def delete_category(request, category_id):
    # Logic to delete a category would go here
    return HttpResponse(f"Hello, this is the delete_category view for category {category_id}.")


