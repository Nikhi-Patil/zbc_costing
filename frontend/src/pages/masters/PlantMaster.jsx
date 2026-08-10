import { useEffect, useRef } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "bootstrap/dist/css/bootstrap.min.css";
import "admin-lte/dist/css/adminlte.min.css";

import "tabulator-tables/dist/css/tabulator.min.css";

import Layout from "../../components/layout/Layout";

function PlantMaster() {
  const tableRef = useRef(null);

  useEffect(() => {
    const table = new Tabulator(tableRef.current, {
        ajaxURL: "/api/plant",
        ajaxConfig: "GET",
        layout: "fitColumns",
        pagination: true,
        paginationSize: 10,
        hozAlign: "center",
        paginationSizeSelector: [10, 25, 50, 100],

        initialSort: [
            {
                column: "id",
                dir: "asc",
            },
        ],
      columns: [
        {
            title: "ID",
            field: "id",
            width:50,
            resizable: false,
            hozAlign: "center",
            headerHozAlign: "center"
        },
        {
            title: "Plant Name",
            field: "plant_name",
            resizable: false,
            hozAlign: "center",
            headerHozAlign: "center"
        },
        {
            title: "Unit",
            field: "unit",
            resizable: false,
            hozAlign: "center",
            headerHozAlign: "center"
        }
      ],
    });

    return () => {
      table.destroy();
    };

  }, []);

  return (
    <Layout>
        <div className="app-content-header" >
            <div className="container-fluid">
                <div className="row">
                    <div className="col-sm-6">
                        <h1 className="mb-0 fs-3">Plant Master</h1>
                    </div>
                    <div className="col-sm-6">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb float-sm-end">
                                <button className="btn btn-success" data-bs-toggle="modal" >
                                    <i className="fas fa-plus"></i>
                                    Add Plant   
                                </button>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <div className="card">
    <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Plant Master</h3>

    </div>

    <div className="card-body">
        <div className="table-container">
            <div ref={tableRef}></div>
        </div>
    </div>
</div>
    </Layout>
  );
}

export default PlantMaster;