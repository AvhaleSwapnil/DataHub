export async function fetchCustomers() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/customers`);

    if (!response.ok) {
      console.warn(`[API Error] Failed to fetch customers: ${response.status}`);
      return { QueryResponse: { Customer: [] } };
    }

    return await response.json();
  } catch (error) {
    console.warn(`[Network Error] Failed to fetch customers:`, error);
    return { QueryResponse: { Customer: [] } };
  }
}
export async function updateCustomer(id: string, data: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/customers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update customer");

  return res.json();
}

export async function createCustomer(data: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create customer");

  return res.json();
}
