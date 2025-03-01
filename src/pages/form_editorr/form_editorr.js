import React, { useEffect, useRef } from 'react';
import { FormEditor } from '@bpmn-io/form-js-editor';

const FormEditor2 = () => {
  const editorContainerRef = useRef(null);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const schema = {
      type: 'default',
      components: [
        {
          key: 'creditor',
          label: 'Creditor',
          type: 'textfield',
          validate: {
            required: true,
          },
        },
      ],
    };

    const formEditor = new FormEditor({
      container: editorContainerRef.current,
    });

    formEditor.importSchema(schema).catch((err) => {
      console.error('Failed to import schema:', err);
    });

    return () => {
      formEditor.destroy();
    };
  }, []);

  return <div ref={editorContainerRef} id="form-editor" style={{ width: '100%', height: '500px' }} />;
};

export default FormEditor2;
