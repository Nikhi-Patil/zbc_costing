import { useEffect, useState } from "react";

const CompoundMaster = () => {
  const [compounds, setCompounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCompounds = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/compounds");

        if (!response.ok) {
          throw new Error("Failed to fetch compounds");
        }

        const data = await response.json();

        setCompounds(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompounds();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="compound-master">
      <h2>Compound Master</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Polymer Name</th>
            <th>Compound Code</th>
            <th>Im Code</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Updated By</th>
            <th>Updated At</th>
          </tr>
        </thead>

        <tbody>
          {compounds.map((compound) => (
            <tr key={compound.id}>
              <td>{compound.id}</td>

              <td>{compound.polymer}</td>

              <td>{compound.compound_code}</td>

              <td>{compound.im_code}</td>

              <td>{compound.created_by || "-"}</td>

              <td>{compound.created_at || "-"}</td>

              <td>{compound.updated_by || "-"}</td>

              <td>{compound.updated_at || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompoundMaster;
