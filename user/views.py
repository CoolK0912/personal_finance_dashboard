from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def user_profile(request, user_id):
   # Logic to view user profile would go here
   return HttpResponse(f"User profile for user {user_id}.")


def balance_summary(request):
   # Logic to view balance summary would go here
   return HttpResponse("Here is the balance summary for + {account_id}.")



