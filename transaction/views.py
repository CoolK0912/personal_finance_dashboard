from django.shortcuts import render
from django.http import HttpResponse
from .models import Transaction

# Create your views here.
def index(request):
    latest_transaction_list = Transaction.objects.order_by("-pub_date")[:5]
    output = ", ".join([t.description for t in latest_transaction_list])
    return HttpResponse(output)

def add_transaction(request):
    # Logic to add a transaction would go here
    return HttpResponse("Transaction added successfully.")

def view_transactions(request):
    # Logic to view transactions would go here
    return HttpResponse("Here are the transactions.")

def delete_transaction(request, transaction_id):
    # Logic to delete a transaction would go here
    return HttpResponse(f"Transaction {transaction_id} deleted successfully.")


