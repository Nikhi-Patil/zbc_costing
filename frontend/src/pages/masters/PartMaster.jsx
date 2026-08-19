import {useEffect,useState} from "react";
import API_BASE_URL from "../../config/api";

function PartMaster() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/parts`);

        if (!response.ok) {
          throw new Error("Failed to fetch parts");
        }

        const data = await response.json();

        setParts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="part-master">
      <h2>Unit Master</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Part Name</th>
            <th>Part No</th>
            <th>FG Code</th>
            <th>IM Code</th>
            <th>Inter Unit/Dept Code</th>
            <th>Unit</th>
            <th>Department</th>
            <th>Sub Department</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Updated By</th>
            <th>Updated At</th>
          </tr>
        </thead>

        <tbody>
          {parts.map((part) => (
            <tr key={part.id}>
              <td>{part.id}</td>

              <td>{part.part_name}</td>

              <td>{part.part_no}</td>

              <td>{part.fg_code}</td>
              <td>{part.im_code}</td>
              <td>{part.inter_code}</td>
              <td>{part.unit}</td>
              <td>{part.department_name}</td>
              <td>{part.sub_department_name}</td>

              <td>{part.created_by || "-"}</td>

              <td>{part.created_at || "-"}</td>

              <td>{part.updated_by || "-"}</td>

              <td>{part.updated_at || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PartMaster;
