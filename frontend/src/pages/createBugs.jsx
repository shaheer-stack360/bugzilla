import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CreateBug() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expected_behavior: '',
    actual_behavior: '',
    priority: 'Medium'
  });
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const bugData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        bugData.append(key, formData[key]);
      });
      
      // Add attachments
      attachments.forEach(file => {
        bugData.append('attachments', file);
      });

      const response = await api.post('/bugs', bugData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Bug created:', response.data);
      setSuccess('Bug reported successfully!');
      
      // Redirect to bugs list after 2 seconds
      setTimeout(() => {
        navigate('/bugs');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Error creating bug:', err);
      setError(err.response?.data?.message || 'Failed to report bug');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/bugs');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Report New Bug</h1>
        <button 
          onClick={handleCancel}
          style={{ 
            padding: '8px 16px', 
            background: '#6c757d', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Cancel
        </button>
      </div>

      {success && (
        <div style={{ 
          color: '#155724', 
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Success!</strong> {success}
        </div>
      )}

      {error && (
        <div style={{ 
          color: '#721c24', 
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Brief description of the bug"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="Detailed description of the bug"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Expected Behavior *
          </label>
          <textarea
            name="expected_behavior"
            value={formData.expected_behavior}
            onChange={handleChange}
            required
            rows="3"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="What should happen normally"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Actual Behavior *
          </label>
          <textarea
            name="actual_behavior"
            value={formData.actual_behavior}
            onChange={handleChange}
            required
            rows="3"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="What actually happens"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Priority *
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Attachments
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          {attachments.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              <strong>Selected files:</strong> {attachments.length} file(s)
              <ul style={{ margin: '5px 0 0 20px' }}>
                {attachments.map((file, index) => (
                  <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '12px 30px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              flex: 1
            }}
          >
            {loading ? 'Reporting Bug...' : 'Report Bug'}
          </button>

          <button 
            type="button"
            onClick={handleCancel}
            style={{ 
              padding: '12px 30px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              flex: 1
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}