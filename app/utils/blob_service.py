from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas
from datetime import datetime, timedelta

from app.config import AzureStorageSettings

from dotenv import load_dotenv
load_dotenv()


azure_settings = AzureStorageSettings()

connection_string = (
    f"DefaultEndpointsProtocol=https;AccountName={azure_settings.AZURE_STORAGE_ACCOUNT_NAME};AccountKey={azure_settings.AZURE_STORAGE_KEY};EndpointSuffix=core.windows.net"
)
blob_service_client = BlobServiceClient.from_connection_string(connection_string)

container_client = blob_service_client.get_container_client(azure_settings.AZURE_STORAGE_CONTAINER_NAME)

def upload_to_blob(blob_name:str, data:bytes) -> None:
    container_client.upload_blob(name=blob_name, data=data, overwrite=True)

def generate_signed_url(blob_name:str,hours:int=1) -> str:
    sas_token = generate_blob_sas(
        account_name = azure_settings.AZURE_STORAGE_ACCOUNT_NAME,
        container_name = azure_settings.AZURE_STORAGE_CONTAINER_NAME,
        blob_name = blob_name,
        account_key = azure_settings.AZURE_STORAGE_KEY,
        permission = BlobSasPermissions(read=True),
        expiry = datetime.now() + timedelta(hours=hours)

    )
    return f"https://{azure_settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/{azure_settings.AZURE_STORAGE_CONTAINER_NAME}/{blob_name}?{sas_token}"


def delete_blob(blob_name:str) -> None:
    container_client.delete_blob(blob_name)
