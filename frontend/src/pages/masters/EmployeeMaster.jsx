import { useEffect, useState } from "react";
import API_BASE_URL from "../../config/api";

function EmployeeMaster() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/employees`);

        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }

        const data = await response.json();

        setEmployees(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="employee-master">
      <h2>Employee Master</h2>

      <div className="master-table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee Name</th>
              <th>User Name</th>
              <th>Email</th>
              <th>Location</th>
              <th>Contact No</th>
              <th>Designation</th>
              <th>Level</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Updated By</th>
              <th>Updated At</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.id}</td>

                <td>{employee.employee_name}</td>

                <td>{employee.user_name}</td>

                <td>{employee.email}</td>

                <td>{employee.location}</td>

                <td>{employee.contact_no}</td>

                <td>{employee.designation_name}</td>

                <td>{employee.level}</td>

                <td>{employee.status}</td>

                <td>{employee.created_by || "-"}</td>

                <td>{employee.created_at || "-"}</td>

                <td>{employee.updated_by || "-"}</td>

                <td>{employee.updated_at || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default EmployeeMaster;
