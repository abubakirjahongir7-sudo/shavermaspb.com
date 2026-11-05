import { OrderStatusPage } from "@/components/features/OrderStatusPage";

interface OrderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { id } = await params;
  const { t } = await searchParams;
  return <OrderStatusPage orderId={Number(id)} token={t ?? ""} />;
}
