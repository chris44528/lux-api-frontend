import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { note: string; image?: File; image_description?: string }) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [note, setNote] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imageDescription, setImageDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;
        
        const data = {
            note: note.trim(),
            ...(image && { image }),
            ...(imageDescription.trim() && { image_description: imageDescription.trim() })
        };
        onSubmit(data);
        
        // Reset form
        setNote('');
        setImage(null);
        setImageDescription('');
        onClose();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Add Note</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                            Note
                        </label>
                        <textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                            Image (optional)
                        </label>
                        <input
                            type="file"
                            id="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    {image && (
                        <div className="mb-4">
                            <label htmlFor="imageDescription" className="block text-sm font-medium text-gray-700 mb-1">
                                Image Description
                            </label>
                            <input
                                type="text"
                                id="imageDescription"
                                value={imageDescription}
                                onChange={(e) => setImageDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Describe the image"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NoteModal;
