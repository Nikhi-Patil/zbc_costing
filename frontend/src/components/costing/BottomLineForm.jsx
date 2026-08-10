import React from "react";

function BottomLineForm({ formData, handleInputChange }) {
    const bottomLineData = [
        {
            id: 1,
            parameter: "ICC on RM",
            value: "1.00"
        },
        {
            id: 2,
            parameter: "Rej on Subtotal",
            value: "3.00"
        },
        {
            id: 3,
            parameter: "O/H on Subtotal",
            value: "10.00"
        },
        {
            id: 4,
            parameter: "Profit on Subtotal",
            value: "10.00"
        },
        {
            id: 5,
            parameter: "Packaging on Subtotal",
            value: "1.50"
        },
        {
            id: 6,
            parameter: "Transport on Subtotal",
            value: "1.50"
        }
    ];

    return (
        <div className="bottom-line-container">
            {/* Header */}
            <div className="bottom-line-header">
                <div>
                    <b>Part No-</b>
                    <span> {formData.partNo || "183034B1003-A Jcb Base Seal Assy"}</span>
                </div>

                <div>
                    <b>Customer-</b>
                    <span>
                        {formData.customerName ||
                            "Gates Unitta India Company Pvt Ltd"}
                    </span>
                </div>

            </div>


            {/* Table */}
            <div className="bottom-line-table-wrapper">

                <table className="bottom-line-table">

                    <thead>
                        <tr>
                            <th className="sr-column">
                                Sr. No.
                            </th>

                            <th className="parameter-column">
                                Parameter
                            </th>

                            <th className="percentage-column">
                                Percentage
                            </th>

                            <th className="action-column">
                                {/* Empty */}
                            </th>
                        </tr>
                    </thead>


                    <tbody>

                        {bottomLineData.map((item) => (

                            <tr key={item.id}>

                                {/* Sr No */}
                                <td className="text-center">
                                    {item.id}
                                </td>


                                {/* Parameter */}
                                <td>
                                    {item.parameter}
                                </td>


                                {/* Percentage */}
                                <td className="percentage-cell">

                                    <div className="percentage-input">

                                        <input
                                            type="number"
                                            step="0.01"
                                            name={`bottomLine_${item.id}`}
                                            defaultValue={item.value}
                                        />

                                        <span>%</span>

                                    </div>

                                </td>


                                {/* Edit */}
                                <td className="action-cell">

                                    <button
                                        type="button"
                                        className="bottom-edit-btn"
                                        onClick={() =>
                                            console.log(
                                                "Edit",
                                                item.parameter
                                            )
                                        }
                                    >
                                        Edit
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default BottomLineForm;