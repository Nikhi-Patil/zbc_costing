import { useEffect, useState } from "react";
import API_BASE_URL from "../../config/api";

function CustomerMaster() {
  const [customer, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/customers`);

        if (!response.ok) {
          throw new Error("Failed to fetch customer");
        }

        const data = await response.json();

        setCustomers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="customer-master">
      <h2>Customer Master</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer Name</th>
            <th>SUb Customer Code</th>
            <th>Domestic/Export</th>
            <th>Zone</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Updated By</th>
            <th>Updated At</th>
          </tr>
        </thead>

        <tbody>
          {customer.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>

              <td>{customer.customer_name}</td>

              <td>{customer.sub_customer}</td>

              <td>{customer.geo_type}</td>

              <td>{customer.zone}</td>

              <td>{customer.created_by || "-"}</td>

              <td>{customer.created_at || "-"}</td>

              <td>{customer.updated_by || "-"}</td>

              <td>{customer.updated_at || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerMaster;
