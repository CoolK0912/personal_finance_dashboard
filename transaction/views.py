from django.shortcuts import render
from django.http import HttpResponse
from .models import Transaction
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser
from transaction.models import Transaction
from transaction.serializers import TransactionSerializer

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

def transaction_list(request):
    if request.method == 'GET':
        transactions = Transaction.objects.all()
        serializer = TransactionSerializer(transactions, many=True)
        return JsonResponse(serializer.data, safe=False)
    elif request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = TransactionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)
    
def transaction_detail(request, pk):
    try:
        transaction = Transaction.objects.get(pk=pk)
    except Transaction.DoesNotExist:
        return HttpResponse(status=404)

    if request.method == 'GET':
        serializer = TransactionSerializer(transaction)
        return JsonResponse(serializer.data)
    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        serializer = TransactionSerializer(transaction, data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=400)
    elif request.method == 'DELETE':
        transaction.delete()
        return HttpResponse(status=204)
