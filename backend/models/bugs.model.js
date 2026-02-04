import mongoose from 'mongoose';


const Schema = mongoose.Schema;

const bugsSchema = new mongoose.Schema({
    id: { type: String },
    title: { type: String },
    description: { type: String },
    expected_behavior: { type: String },
    actual_behavior: { type: String },
    attachments: [{ type: String }],
    priority: { type: String },
    status: { type: String },
    reported_by: { type: String },
    assigned_to: { type: String }
}, { timestamps: true });

const Bug = mongoose.model('Bug', bugsSchema);

export default Bug;