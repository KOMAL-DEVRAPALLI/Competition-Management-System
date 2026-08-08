import "./LiftControls.css"
const LiftControls = ({
    processingLift,
    onProcessLift,
}) => {
    return (
        <div className="lift-decision">

            <button
                type="button"
                className="good-btn"
                disabled={processingLift}
                onClick={() =>
                    onProcessLift("GOOD")
                }
            >
                GOOD LIFT
            </button>

            <button
                type="button"
                className="no-lift-btn"
                disabled={processingLift}
                onClick={() =>
                    onProcessLift("NO_LIFT")
                }
            >
                NO LIFT
            </button>

        </div>
    );
};

export default LiftControls;