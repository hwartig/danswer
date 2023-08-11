"use client";

import * as Yup from "yup";
import { ContentfulIcon, TrashIcon } from "@/components/icons/icons";
import { TextFormField } from "@/components/admin/connectors/Field";
import { HealthCheckBanner } from "@/components/health/healthcheck";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  ContentfulConfig,
  ContentfulCredentialJson,
  Credential,
  ConnectorIndexingStatus,
} from "@/lib/types";
import { ConnectorForm } from "@/components/admin/connectors/ConnectorForm";
import { LoadingAnimation } from "@/components/Loading";
import { CredentialForm } from "@/components/admin/connectors/CredentialForm";
import { deleteCredential, linkCredential } from "@/lib/credential";
import { ConnectorsTable } from "@/components/admin/connectors/table/ConnectorsTable";

const Main = () => {
  const { mutate } = useSWRConfig();
  const {
    data: connectorIndexingStatuses,
    isLoading: isConnectorIndexingStatusesLoading,
    error: isConnectorIndexingStatusesError,
  } = useSWR<ConnectorIndexingStatus<any, any>[]>(
    "/api/manage/admin/connector/indexing-status",
    fetcher
  );

  const {
    data: credentialsData,
    isLoading: isCredentialsLoading,
    error: isCredentialsError,
  } = useSWR<Credential<ContentfulCredentialJson>[]>(
    "/api/manage/credential",
    fetcher
  );

  if (
    (!connectorIndexingStatuses && isConnectorIndexingStatusesLoading) ||
    (!credentialsData && isCredentialsLoading)
  ) {
    return <LoadingAnimation text="Loading" />;
  }

  if (isConnectorIndexingStatusesError || !connectorIndexingStatuses) {
    return <div>Failed to load connectors</div>;
  }

  if (isCredentialsError || !credentialsData) {
    return <div>Failed to load credentials</div>;
  }

  const contentfulConnectorIndexingStatuses: ConnectorIndexingStatus<
    ContentfulConfig,
    ContentfulCredentialJson
  >[] = connectorIndexingStatuses.filter(
    (connectorIndexingStatus) =>
      connectorIndexingStatus.connector.source === "contentful"
  );
  const contentfulCredential = credentialsData.filter(
    (credential) => credential.credential_json?.contentful_cma_token
  )[0];

  return (
    <>
      <h2 className="font-bold mb-2 mt-6 ml-auto mr-auto">
        Step 1: Provide your CMA Access Token
      </h2>
      {contentfulCredential ? (
        <>
          {" "}
          <div className="flex mb-1 text-sm">
            <p className="my-auto">Existing CMA Access Token: </p>
            <p className="ml-1 italic my-auto">
              {contentfulCredential.credential_json.contentful_cma_token}
            </p>{" "}
            <button
              className="ml-1 hover:bg-gray-700 rounded-full p-1"
              onClick={async () => {
                await deleteCredential(contentfulCredential.id);
                mutate("/api/manage/credential");
              }}
            >
              <TrashIcon />
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">
            If you don&apos;t have a CMA Access Token, you can create one{" "}
            <a
              className="text-blue-500"
              href="https://app.contentful.com/deeplink?link=api"
            >
              here
            </a>
          </p>
          <div className="border-solid border-gray-600 border rounded-md p-6 mt-2">
            <CredentialForm<ContentfulCredentialJson>
              formBody={
                <>
                  <TextFormField
                    name="contentful_cma_token"
                    label="CMA Access Token:"
                    type="password"
                  />
                </>
              }
              validationSchema={Yup.object().shape({
                contentful_cma_token: Yup.string().required(
                  "Please enter the CMA access token for Contentful"
                ),
              })}
              initialValues={{
                contentful_cma_token: "",
              }}
              onSubmit={(isSuccess) => {
                if (isSuccess) {
                  mutate("/api/manage/credential");
                }
              }}
            />
          </div>
        </>
      )}

      <h2 className="font-bold mb-2 mt-6 ml-auto mr-auto">
        Step 2: Which spaces do you want to make searchable?
      </h2>

      {contentfulConnectorIndexingStatuses.length > 0 && (
        <>
          <p className="text-sm mb-2">
            We pull the latest Pull Requests from each repository listed below
            every <b>10</b> minutes.
          </p>
          <div className="mb-2">
            <ConnectorsTable<ContentfulConfig, ContentfulCredentialJson>
              connectorIndexingStatuses={contentfulConnectorIndexingStatuses}
              liveCredential={contentfulCredential}
              getCredential={(credential) =>
                credential.credential_json.contentful_cma_token
              }
              onCredentialLink={async (connectorId) => {
                if (contentfulCredential) {
                  await linkCredential(connectorId, contentfulCredential.id);
                  mutate("/api/manage/admin/connector/indexing-status");
                }
              }}
              specialColumns={[
                {
                  header: "SpaceEnv",
                  key: "SpaceEnv",
                  getValue: (connector) =>
                    `${connector.connector_specific_config.space}/${connector.connector_specific_config.environment}`,
                },
              ]}
              onUpdate={() =>
                mutate("/api/manage/admin/connector/indexing-status")
              }
            />
          </div>
        </>
      )}

      {contentfulCredential ? (
        <div className="border-solid border-gray-600 border rounded-md p-6 mt-4">
          <h2 className="font-bold mb-3">Connect to a New Space</h2>
          <ConnectorForm<ContentfulConfig>
            nameBuilder={(values) =>
              `ContentfulConnector-${values.space}/${values.environment}`
            }
            source="contentful"
            inputType="load_state"
            formBody={
              <>
                <TextFormField name="space" label="Space:" />
                <TextFormField name="environment" label="Environment:" />
              </>
            }
            validationSchema={Yup.object().shape({
              space: Yup.string().required(
                "Please enter the id of the space to index e.g. cg3g9ejug8Ym"
              ),
              environment: Yup.string().required(
                "Please enter the name of the environment to index e.g. master"
              ),
            })}
            initialValues={{
              space: "",
              environment: "",
            }}
            refreshFreq={10 * 60} // 10 minutes
            onSubmit={async (isSuccess, responseJson) => {
              if (isSuccess && responseJson) {
                await linkCredential(responseJson.id, contentfulCredential.id);
                mutate("/api/manage/admin/connector/indexing-status");
              }
            }}
          />
        </div>
      ) : (
        <p className="text-sm">
          Please provide your CMA access token in Step 1 first! Once done with
          that, you can then specify which Contentful Spaces you want to make
          searchable.
        </p>
      )}
    </>
  );
};

export default function Page() {
  return (
    <div className="container mx-auto">
      <div className="mb-4">
        <HealthCheckBanner />
      </div>
      <div className="border-solid border-gray-600 border-b mb-4 pb-2 flex">
        <ContentfulIcon size={32} />
        <h1 className="text-3xl font-bold pl-2">Contentful Entries</h1>
      </div>
      <Main />
    </div>
  );
}
