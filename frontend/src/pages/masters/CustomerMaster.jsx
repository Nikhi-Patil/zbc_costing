import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import API_BASE_URL from "../../config/api";

function CustomerMaster() {
  const [customer, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/customers`);

        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }

        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const columns = [
    {
      name: "ID",
      selector: (row) => row.id,
      width: "80px",
      sortable: true,
      center: true,
    },
    {
      name: "Customer Name",
      selector: (row) => row.customer_name || "-",
      minWidth: "180px",
      wrap: true,
      sortable: true,
    },
    {
      name: "Sub Customer Code",
      selector: (row) => row.sub_customer || "-",
      minWidth: "170px",
      wrap: true,
      sortable: true,
    },
    {
      name: "Domestic/Export",
      selector: (row) => row.geo_type || "-",
      minWidth: "150px",
      sortable: true,
      center: true,
    },
    {
      name: "Zone",
      selector: (row) => row.zone || "-",
      minWidth: "120px",
      sortable: true,
      center: true,
    },
  ];

  const customStyles = {
    table: {
      style: {
        width: "100%",
      },
    },
    headRow: {
      style: {
        minHeight: "48px",
        backgroundColor: "#19244a",
        borderBottom: "1px solid #d7d7d7",
      },
    },
    headCells: {
      style: {
        justifyContent: "center",
        textAlign: "center",
        fontSize: "13px",
        fontWeight: "600",
        padding: "12px",
        color: "#ffffff",
        borderRight: "1px solid #d7d7d7",
      },
    },
    rows: {
      style: {
        minHeight: "48px",
        fontSize: "13px",
        borderBottom: "1px solid #d7d7d7",
        "&:hover": {
          backgroundColor: "#f9f9f9",
        },
      },
    },
    cells: {
      style: {
        padding: "12px",
        overflowWrap: "anywhere",
        borderRight: "1px solid #d7d7d7",
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid #ddd",
        minHeight: "52px",
      },
    },
  };

  const filteredCustomers = customer.filter((item) => {
    const search = searchText.toLowerCase().trim();

    if (!search) return true;

    return [
      item.id,
      item.customer_name,
      item.sub_customer,
      item.geo_type,
      item.zone,
      item.created_by,
      item.created_at,
      item.updated_by,
      item.updated_at,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search),
    );
  });

  return (
    <div className="customer-master">
      <div className="customer-master-toolbar">
        <h2>Customer Master</h2>

        <div className="customer-master-search">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search customers"
          />

          {searchText && (
            <button
              type="button"
              className="customer-master-search-clear"
              onClick={() => setSearchText("")}
              aria-label="Clear search"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {error && <p className="customer-master-error">Error: {error}</p>}

      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyField="id"
        customStyles={customStyles}
        progressPending={loading}
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 25, 50, 100]}
        highlightOnHover
        responsive
        striped
        persistTableHead
        noDataComponent={
          searchText ? "No matching customers found" : "No customers found"
        }
      />
    </div>
  );
}

export default CustomerMaster;
