import itertools
from collections.abc import Generator
from typing import Any

from contentful_management import Client
from contentful_management import Link

from danswer.configs.app_configs import INDEX_BATCH_SIZE
from danswer.configs.constants import DocumentSource
from danswer.connectors.interfaces import GenerateDocumentsOutput
from danswer.connectors.interfaces import LoadConnector
from danswer.connectors.models import ConnectorMissingCredentialError
from danswer.connectors.models import Document
from danswer.connectors.models import Section
from danswer.utils.logger import setup_logger


logger = setup_logger()


class ContentfulConnector(LoadConnector):
    def __init__(
        self,
        space: str,
        environment: str,
    ) -> None:
        self.space = space
        self.environment = environment
        self.contentful_client: Client | None = None

    def load_credentials(self, credentials: dict[str, Any]) -> dict[str, Any] | None:
        self.contentful_client = Client(credentials["contentful_cma_token"])
        return None

    def load_from_state(self) -> GenerateDocumentsOutput:
        if self.contentful_client is None:
            raise ConnectorMissingCredentialError("Contentful")
        entries = self.contentful_client.entries(self.space, self.environment).all()

        for entry in entries:
            logger.info(f"Processing {entry}")

            sections = []

            for fieldName, field in entry.fields().items():
                if not isinstance(field, Link) and isinstance(
                    field, str
                ):  # ignore links and rich text for now
                    logger.info(f" Adding Section for {fieldName} with value {field}")
                    sections.append(
                        Section(
                            link=f"https://app.contentful.com/spaces/{self.space}/environments/{self.environment}/entries/{entry.sys['id']}",
                            text=field,
                        )
                    )

            if len(sections) > 0:
                yield [
                    Document(
                        id=entry.sys["id"],
                        sections=sections,
                        semantic_identifier=sections[0].text,
                        source=DocumentSource.CONTENTFUL,
                        metadata={
                            "created_at": entry.sys["created_at"].strftime(
                                "%Y-%m-%d %H:%M:%S%z"
                            ),
                        },
                    )
                ]
