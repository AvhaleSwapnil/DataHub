export async function fetchCustomers() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/customers`);

  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.status}`);
  }

  return await response.json();
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
