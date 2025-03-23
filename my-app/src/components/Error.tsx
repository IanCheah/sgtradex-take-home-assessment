import React from "react";

interface ErrorMessageProps {
    message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return <p className="error">{message}</p>;
};

export default ErrorMessage;