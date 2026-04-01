export async function fetchInvoices() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/invoices`);

    if (!response.ok) {
      console.warn(`[API Error] Failed to fetch invoices: ${response.status}`);
      return { QueryResponse: { Invoice: [] } };
    }

    return await response.json();
  } catch (error) {
    console.warn(`[Network Error] Failed to fetch invoices:`, error);
    return { QueryResponse: { Invoice: [] } };
  }
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

export async function getInvoiceByDocNumber(docNumber: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/invoices/doc/${docNumber}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch invoice ${docNumber}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`[API Error] getInvoiceByDocNumber:`, error);
    return null;
  }
}
