import { useState } from "react";

import Stepper from "../../components/costing/Stepper";
import WizardButtons from "../../components/costing/WizardButtons";

import PartDetailsForm from "../../components/costing/PartDetailsForm";
import RMDetailsForm from "../../components/costing/RMDetailsForm";
import ProcessDetailsForm from "../../components/costing/ProcessDetailsForm";
import BottomLineForm from "../../components/costing/BottomLineForm";
import OutsourcingForm from "../../components/costing/OutsourcingForm";

function CostingWizard() {

    const [currentStep, setCurrentStep] = useState(1);

    // Only ONE BOP state
    const [bops, setBops] = useState([]);
    const totalSteps = 5;
    // =========================
    // FORM DATA
    // =========================
    const [formData, setFormData] = useState({
        financialYear: "",
        month: "",
        effectiveDate: "",
        customerName: "",
        productionUnit: "",
        billingUnit: "",
        subDepartment: "",
        subCategory: "",
        partNo: "",
        partName: "",
        fgcode: "",
        imcode: "",
        grossWeight: "",
        netWeight: "",
        loadingWeight: "",

        hasBop: "",


        polymerName : "",
        compoundCode : "",
        imCode : "",
        compMonth:"",
        compoundRate : "",
        loadingWeight : "",
        netWeight : "",
        loadingper : "",


        processType:"",
        machineTonnage:"",
        cavity:"",
        runningcavity:"",
        cycleTime:"",
        PlattenSize:"",
        toolSize:"",
        
    });
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };
    const handleBopChange = (e) => {
        const value = e.target.value;
        // Save Yes / No into formData
        setFormData((prev) => ({
            ...prev,
            hasBop: value
        }));
        // automatically create BOP 1
        if (value === "Yes" && bops.length === 0) {

            setBops([
                {
                    id: Date.now(),

                    bopPartNo: "",
                    bopPartName: "",
                    commodity: "",
                    supplierName: "",
                    bopAssemblyQty: "",
                    bopFgCode: "",
                }
            ]);
        }
        // If No, remove all BOPs
        if (value === "No") {
            setBops([]);
        }
    };
    // =========================
    // ADD BOP
    // =========================
    const addBop = () => {
        setBops((prev) => [
            ...prev,{
                id: Date.now(),
                bopPartNo: "",
                bopPartName: "",
                commodity: "",
                supplierName: "",
                bopAssemblyQty: "",
                bopFgCode: "",
            }
        ]);
    };

    const addBopRate = () => {
        setBops((prev) => [
            ...prev,{
                id: Date.now(),
                bopPartNo: "",
                bopPartName: "",
                commodity: "",
                supplierName: "",
                bopAssemblyQty: "",
                bopFgCode: "",
                bopMonth:"",
                bopRate:"",
            }
        ]);
    };
    // =========================
    // DELETE BOP
    // =========================
    const deleteBop = (id) => {
        setBops((prev) =>
            prev.filter((bop) => bop.id !== id)
        );
    };
    // =========================
    // NEXT
    // =========================
    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep((prev) => prev + 1);
        }
    };
    // =========================
    // PREVIOUS
    // =========================
    const previousStep = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };
    return (
        <>
            <Stepper
                currentStep={currentStep}
                totalSteps={totalSteps}
            />

            {currentStep === 1 && (
                <PartDetailsForm
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleBopChange={handleBopChange}
                    bopList={bops}
                    addBop={addBop}
                    deleteBop={deleteBop}
                />
            )}
            {currentStep === 2 && (
                <RMDetailsForm
                    formData={formData}
                    handleInputChange={handleInputChange}
                    addBopRate={addBopRate}
                    bopList={bops}  
                />
            )}
            {currentStep === 3 && (
                <ProcessDetailsForm
                    formData={formData}
                    handleInputChange={handleInputChange}
                />
            )}
            {currentStep === 4 && (
                <BottomLineForm
                    formData={formData}
                    handleInputChange={handleInputChange}
                />
            )}
            {currentStep === 5 && (
                <OutsourcingForm
                    formData={formData}
                    handleInputChange={handleInputChange}
                />
            )}
            <WizardButtons
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={previousStep}
                onNext={nextStep}
                onSaveDraft={() =>
                    console.log("Draft Saved", {
                        formData,
                        bops
                    })
                }
                onSubmit={() =>
                    console.log("Submitted", {
                        formData,
                        bops
                    })
                }
            />
        </>
    );
}

export default CostingWizard;