import React, { useState } from "react";
import { Upload, Button, message, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { parsePDF, parseDOCX } from "../../services/resumeService.js";

const ResumeUploader = ({ onParsed }) => {
  const [fileList, setFileList] = useState([]);

  const beforeUpload = async (file) => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx");
    if (!isPdf && !isDocx) {
      message.error("Invalid file. Please upload a PDF or DOCX.");
      return Upload.LIST_IGNORE;
    }
    try {
      let text = "";
      if (isPdf) {
        console.log("Parsing PDF...");
        text = await parsePDF(file);
      } else {
        console.log("Parsing DOCX...");
        text = await parseDOCX(file);
      }
      console.log("Parsed text length:", text.length);
      onParsed(text, { fileName: file.name, fileType: file.type });
      setFileList([file]);
    } catch (e) {
      console.error("Resume parsing error:", e);
      message.error("Failed to parse resume. Error: " + e.message);
    }
    return Upload.LIST_IGNORE; // prevent auto upload
  };

  return (
    <div>
      <Typography.Paragraph type="secondary">
        PDF preferred; DOCX supported as fallback.
      </Typography.Paragraph>
      <Upload
        beforeUpload={beforeUpload}
        fileList={fileList}
        onRemove={() => setFileList([])}
      >
        <Button icon={<UploadOutlined />}>Select Resume</Button>
      </Upload>
    </div>
  );
};

export default ResumeUploader;
