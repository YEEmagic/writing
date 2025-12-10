import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const buttonStyle = {
        marginRight: '5px',
        padding: '5px 10px',
        cursor: 'pointer',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        borderRadius: '4px'
    };

    const activeButtonStyle = {
        ...buttonStyle,
        backgroundColor: 'black',
        color: 'white',
        borderColor: 'black'
    };

    const fontFamilies = [
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Times New Roman', value: '"Times New Roman", serif' },
        { label: 'Courier New', value: '"Courier New", monospace' },
    ];

    const colorPalette = [
        '#000000', '#d32f2f', '#1976d2', '#388e3c', '#fbc02d', '#6a1b9a',
    ];

    return (
        <div className="menu-bar" style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            {/* 폰트 패밀리 */}
            <select
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                value={editor.getAttributes('textStyle').fontFamily || ''}
                style={{ marginRight: '8px', padding: '5px' }}
            >
                <option value="">기본 폰트</option>
                {fontFamilies.map((font) => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                ))}
            </select>

            {/* 글자색 */}
            <select
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                value={editor.getAttributes('textStyle').color || ''}
                style={{ marginRight: '8px', padding: '5px' }}
            >
                <option value="">글자색</option>
                {colorPalette.map((color) => (
                    <option key={color} value={color}>{color}</option>
                ))}
            </select>

            {/* 배경색 */}
            <select
                onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                value={editor.isActive('highlight') ? editor.getAttributes('highlight').color || '' : ''}
                style={{ marginRight: '12px', padding: '5px' }}
            >
                <option value="">배경색</option>
                {colorPalette.map((color) => (
                    <option key={color} value={color}>{color}</option>
                ))}
            </select>

            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                style={editor.isActive('bold') ? activeButtonStyle : buttonStyle}
            >
                Bold
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                style={editor.isActive('italic') ? activeButtonStyle : buttonStyle}
            >
                Italic
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                style={editor.isActive('underline') ? activeButtonStyle : buttonStyle}
            >
                Underline
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                style={editor.isActive('strike') ? activeButtonStyle : buttonStyle}
            >
                Strike
            </button>
            <button
                onClick={() => editor.chain().focus().setParagraph().run()}
                style={editor.isActive('paragraph') ? activeButtonStyle : buttonStyle}
            >
                Paragraph
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                style={editor.isActive('heading', { level: 1 }) ? activeButtonStyle : buttonStyle}
            >
                H1
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                style={editor.isActive('heading', { level: 2 }) ? activeButtonStyle : buttonStyle}
            >
                H2
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                style={editor.isActive('bulletList') ? activeButtonStyle : buttonStyle}
            >
                Bullet List
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                style={editor.isActive('orderedList') ? activeButtonStyle : buttonStyle}
            >
                Numbered List
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                style={editor.isActive({ textAlign: 'left' }) ? activeButtonStyle : buttonStyle}
            >
                Left
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                style={editor.isActive({ textAlign: 'center' }) ? activeButtonStyle : buttonStyle}
            >
                Center
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                style={editor.isActive({ textAlign: 'right' }) ? activeButtonStyle : buttonStyle}
            >
                Right
            </button>
        </div>
    );
};

const STORAGE_KEY = 'tiptap-docs';
const AUTOSAVE_KEY = 'tiptap-autosave';

const TiptapEditor = () => {
    const [documents, setDocuments] = useState([]);
    const [currentId, setCurrentId] = useState(null);
    const [title, setTitle] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            TextStyle,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            Color.configure({ types: ['textStyle'] }),
            Highlight,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: `
            <h2 style="text-align:center;">
                안녕하세요! Tiptap 에디터입니다.
            </h2>
            <p>
                폰트, 색상, 정렬, 리스트 등을 테스트해보세요.
            </p>
        `,
        onUpdate: ({ editor }) => {
            const content = editor.getJSON();
            console.log("📝 에디터 내용 변경됨:", content);
            // 변경 시 로컬 스토리지에 자동 저장
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(content));
        },
    });

    // 저장된 목록/자동 복원 로드
    useEffect(() => {
        const savedList = localStorage.getItem(STORAGE_KEY);
        if (savedList) {
            try {
                setDocuments(JSON.parse(savedList));
            } catch (e) {
                console.warn('목록을 불러오지 못했습니다.', e);
            }
        }
    }, []);

    // 초기 로드 시 자동 저장본 복원
    useEffect(() => {
        if (!editor) return;
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
            try {
                editor.commands.setContent(JSON.parse(saved));
            } catch (e) {
                console.warn('저장된 내용을 불러오지 못했습니다.', e);
            }
        }
    }, [editor]);

    const persistDocuments = (list) => {
        setDocuments(list);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    };

    const handleSave = () => {
        if (!editor) return;
        const content = editor.getJSON();
        const id = currentId ?? `doc-${Date.now()}`;
        const now = new Date().toISOString();
        const exists = documents.find((d) => d.id === id);
        const nextDoc = { id, title: title || '제목 없음', content, updatedAt: now };
        const next = exists
            ? documents.map((d) => (d.id === id ? nextDoc : d))
            : [...documents, nextDoc];
        persistDocuments(next);
        setCurrentId(id);
        alert('저장되었습니다.');
    };

    const handleNew = () => {
        setCurrentId(null);
        setTitle('');
        editor?.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
        localStorage.removeItem(AUTOSAVE_KEY);
    };

    const handleLoad = (doc) => {
        setCurrentId(doc.id);
        setTitle(doc.title);
        editor?.commands.setContent(doc.content);
    };

    return (
        <div className="app-container" style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '16px' }}>
            <div style={{ width: '280px', border: '1px solid #ccc', borderRadius: '8px', padding: '16px', height: 'fit-content' }}>
                <h3 style={{ marginTop: 0 }}>📚 저장된 글</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button style={{ ...{ flex: 1, padding: '6px 8px', cursor: 'pointer', borderRadius: '4px' }, border: '1px solid #ddd' }} onClick={handleNew}>새 글</button>
                    <button style={{ ...{ flex: 1, padding: '6px 8px', cursor: 'pointer', borderRadius: '4px' }, border: '1px solid #ddd' }} onClick={handleSave}>저장</button>
                </div>
                <input
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <div style={{ maxHeight: '400px', overflowY: 'auto', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    {documents.length === 0 && <p style={{ color: '#777' }}>저장된 글이 없습니다.</p>}
                    {documents
                        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
                        .map((doc) => (
                            <div
                                key={doc.id}
                                onClick={() => handleLoad(doc)}
                                style={{
                                    padding: '8px',
                                    marginBottom: '6px',
                                    borderRadius: '6px',
                                    border: doc.id === currentId ? '1px solid #000' : '1px solid #eee',
                                    cursor: 'pointer',
                                    background: doc.id === currentId ? '#f5f5f5' : '#fff'
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>{doc.title}</div>
                                {doc.updatedAt && <div style={{ fontSize: '12px', color: '#777' }}>{new Date(doc.updatedAt).toLocaleString()}</div>}
                            </div>
                        ))}
                </div>
            </div>

            <div className="editor-section" style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', minHeight: '400px', flex: 1 }}>
                <h3 style={{ marginTop: 0 }}>📝 Editor</h3>
                <MenuBar editor={editor} />
                <div style={{ minHeight: '300px', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};

export default TiptapEditor;