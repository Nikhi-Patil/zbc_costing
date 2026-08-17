import { useEffect, useState } from "react";

const UnitMaster = () => {

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchUnits = async () => {

            try {

                const response = await fetch(
                    "http://localhost:5000/api/units"
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch units");
                }

                const data = await response.json();

                setUnits(data);

            } catch (err) {

                setError(err.message);

            } finally {

                setLoading(false);

            }

        };

        fetchUnits();

    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="unit-master">

            <h2>Unit Master</h2>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Unit</th>
                        <th>Address</th>
                        <th>Location</th>
                        <th>Created By</th>
                        <th>Created At</th>
                        <th>Updated By</th>
                        <th>Updated At</th>
                    </tr>
                </thead>

                <tbody>

                    {units.map((unit) => (

                        <tr key={unit.id}>

                            <td>{unit.id}</td>

                            <td>{unit.unit}</td>

                            <td>{unit.address}</td>

                            <td>{unit.location}</td>

                            <td>{unit.created_by || "-"}</td>

                            <td>{unit.created_at || "-"}</td>

                            <td>{unit.updated_by || "-"}</td>

                            <td>{unit.updated_at || "-"}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
};

export default UnitMaster;