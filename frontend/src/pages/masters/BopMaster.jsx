import { useEffect, useState } from "react";

const BopMaster = () => {
  const [bops, setBops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBops = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/bops");

        if (!response.ok) {
          throw new Error("Failed to fetch bops");
        }

        const data = await response.json();

        setBops(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBops();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="bop-master">
      <h2>Bop Master</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Part No</th>
            <th>FG Code</th>
            <th>Bop Part Name</th>
            <th>Bop Part No</th>
            <th>Bop ERP Code</th>
            <th>supplier Name</th>
            <th>Qty</th>
            <th>UMO</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Updated By</th>
            <th>Updated At</th>
          </tr>
        </thead>

        <tbody>
          {bops.map((bop) => (
            <tr key={bop.id}>
              <td>{bop.id}</td>

              <td>{bop.part_no}</td>

              <td>{bop.fg_code}</td>

              <td>{bop.bop_part_name}</td>

              <td>{bop.bop_part_no}</td>

              <td>{bop.bop_erp_code}</td>

              <td>{bop.supplier_name}</td>

              <td>{bop.bop_quantity}</td>

              <td>{bop.umo}</td>

              <td>{bop.created_by || "-"}</td>

              <td>{bop.created_at || "-"}</td>

              <td>{bop.updated_by || "-"}</td>

              <td>{bop.updated_at || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BopMaster;
