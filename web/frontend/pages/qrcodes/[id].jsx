import { LegacyCard, Page, Layout, SkeletonBodyText } from "@shopify/polaris";
import { Loading, TitleBar } from "@shopify/app-bridge-react";
import { QRCodeForm } from "../../components";
import { useParams } from "react-router-dom";
import { useAppQuery } from "../../hooks";

export default function QRCodeEdit() {
  const breadcrumbs = [{ content: "QR codes", url: "/" }];

  const { id } = useParams();

  /*
    Fetch the QR code.
    useAppQuery uses useAuthenticatedQuery from App Bridge to authenticate the request.
    The backend supplements app data with data queried from the Shopify GraphQL Admin API.
  */
  const {
    data: QRCode,
    isLoading,
    isRefetching,
  } = useAppQuery({
    url: `/api/qrcodes/${id}`,
    reactQueryOptions: {
      /* Disable refetching because the QRCodeForm component ignores changes to its props */
      refetchOnReconnect: false,
    },
  });

  /* Loading action and markup that uses App Bridge and Polaris components */
  if (isLoading || isRefetching) {
    return (
      <Page>
        <TitleBar
          title="Edit QR code"
          breadcrumbs={breadcrumbs}
          primaryAction={null}
        />
        <Loading />
        <Layout>
          <Layout.Section>
            <LegacyCard sectioned title="Title">
              <SkeletonBodyText />
            </LegacyCard>
            <LegacyCard title="Product">
              <LegacyCard.Section>
                <SkeletonBodyText lines={1} />
              </LegacyCard.Section>
              <LegacyCard.Section>
                <SkeletonBodyText lines={3} />
              </LegacyCard.Section>
            </LegacyCard>
            <LegacyCard sectioned title="Discount">
              <SkeletonBodyText lines={2} />
            </LegacyCard>
          </Layout.Section>
          <Layout.Section secondary>
            <LegacyCard sectioned title="QR code" />
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar
        title="Edit QR code"
        breadcrumbs={breadcrumbs}
        primaryAction={null}
      />
      <QRCodeForm QRCode={QRCode} />
    </Page>
  );
}
