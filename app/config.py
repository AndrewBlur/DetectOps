from pydantic_settings import BaseSettings
from pydantic import ConfigDict

from azure.storage.blob import BlobServiceClient,ContainerClient

class DBSettings(BaseSettings):
    DB_HOST: str
    DB_PORT: str
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = ConfigDict(env_file="../.env")

class JWTSettings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    model_config = ConfigDict(env_file="../.env")

class AzureStorageSettings(BaseSettings):
    AZURE_STORAGE_ENDPOINT: str
    AZURE_STORAGE_KEY: str
    AZURE_STORAGE_ACCOUNT_NAME: str
    AZURE_STORAGE_CONTAINER_NAME: str

    def model_post_init(self, __context):
            """Runs after BaseSettings loads values — ideal for setup actions."""
            try:
                # Build connection string
                connection_string = (
                    f"DefaultEndpointsProtocol=https;"
                    f"AccountName={self.AZURE_STORAGE_ACCOUNT_NAME};"
                    f"AccountKey={self.AZURE_STORAGE_KEY};"
                    f"EndpointSuffix=core.windows.net"
                )

                client = BlobServiceClient.from_connection_string(connection_string)

                container_client: ContainerClient = client.get_container_client(
                    self.AZURE_STORAGE_CONTAINER_NAME
                )

                if not container_client.exists():
                    container_client.create_container()
                    print(f"✔ Azure container '{self.AZURE_STORAGE_CONTAINER_NAME}' created.")
                else:
                    print(f"ℹ Azure container '{self.AZURE_STORAGE_CONTAINER_NAME}' already exists.")

            except Exception as e:
                print(f"⚠ Error creating Azure container: {e}")


    model_config = ConfigDict(env_file="../.env")





