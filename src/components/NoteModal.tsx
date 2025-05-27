import React, { useState } from 'react';
import { X, Camera, Image } from 'lucide-react';

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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold dark:text-white">Add Note</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Note
                        </label>
                        <textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Image (optional)
                        </label>
                        {!image ? (
                            <label
                                htmlFor="image"
                                className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                                <div className="flex flex-col items-center">
                                    <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Click to add an image</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">Only one image can be added</span>
                                </div>
                                <input
                                    type="file"
                                    id="image"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="sr-only"
                                />
                            </label>
                        ) : (
                            <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                                            {image.name}
                                        </span>
                                    </div>
                                    <label
                                        htmlFor="image"
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer font-medium"
                                    >
                                        Replace
                                        <input
                                            type="file"
                                            id="image"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="sr-only"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {image && (
                        <div className="mb-4">
                            <label htmlFor="imageDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Image Description
                            </label>
                            <input
                                type="text"
                                id="imageDescription"
                                value={imageDescription}
                                onChange={(e) => setImageDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                                placeholder="Describe the image"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
