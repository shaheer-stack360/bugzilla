// models/bugs.model.js
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const bugsSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    expected_behavior: { 
        type: String, 
        required: true 
    },
    actual_behavior: { 
        type: String, 
        required: true 
    },
    attachments: [{ 
        type: String 
    }],
    priority: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: { 
        type: String, 
        enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'],
        default: 'Open'
    },
    reported_by: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    assigned_to: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    }
}, { 
    timestamps: true 
});

const Bug = mongoose.model('Bug', bugsSchema);

export default Bug;