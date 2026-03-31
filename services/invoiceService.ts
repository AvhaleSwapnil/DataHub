export async function fetchInvoices() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/invoices`);

  if (!response.ok) {
    throw new Error(`Failed to fetch invoices: ${response.status}`);
  }

  return await response.json();
}
export async function updateInvoice(id: string, data: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/invoices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update invoice");

  return res.json();
}
