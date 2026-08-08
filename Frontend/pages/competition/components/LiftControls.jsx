import "./LiftControls.css";

const LiftControls = ({
    processingLift,
    onProcessLift,
}) => {

    return (

        <div className="lift-controls">

            <button
                type="button"
                className="good-btn"
                disabled={processingLift}
                onClick={() =>
                    onProcessLift("GOOD")
                }
            >
                {processingLift
                    ? "PROCESSING..."
                    : "GOOD LIFT"
                }
            </button>


            <button
                type="button"
                className="no-lift-btn"
                disabled={processingLift}
                onClick={() =>
                    onProcessLift("NO_LIFT")
                }
            >
                {processingLift
                    ? "PROCESSING..."
                    : "NO LIFT"
                }
            </button>

        </div>

    );
};

export default LiftControls;