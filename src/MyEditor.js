import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image'; // [필수] 이미지 확장 기능 import

// Firebase 관련 (Storage는 필요 없음)
import { db } from './firebase'; 
import { collection, addDoc, updateDoc, getDocs, doc, query, orderBy } from "firebase/firestore";

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

            <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} style={editor.isActive('bold') ? activeButtonStyle : buttonStyle}>Bold</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} style={editor.isActive('italic') ? activeButtonStyle : buttonStyle}>Italic</button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} style={editor.isActive('underline') ? activeButtonStyle : buttonStyle}>Underline</button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} style={editor.isActive('strike') ? activeButtonStyle : buttonStyle}>Strike</button>
            <button onClick={() => editor.chain().focus().setParagraph().run()} style={editor.isActive('paragraph') ? activeButtonStyle : buttonStyle}>Paragraph</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={editor.isActive('heading', { level: 1 }) ? activeButtonStyle : buttonStyle}>H1</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={editor.isActive('heading', { level: 2 }) ? activeButtonStyle : buttonStyle}>H2</button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={editor.isActive('bulletList') ? activeButtonStyle : buttonStyle}>Bullet List</button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={editor.isActive('orderedList') ? activeButtonStyle : buttonStyle}>Numbered List</button>
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} style={editor.isActive({ textAlign: 'left' }) ? activeButtonStyle : buttonStyle}>Left</button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} style={editor.isActive({ textAlign: 'center' }) ? activeButtonStyle : buttonStyle}>Center</button>
            <button onClick={() => editor.chain().focus().setTextAlign('right').run()} style={editor.isActive({ textAlign: 'right' }) ? activeButtonStyle : buttonStyle}>Right</button>
            
            {/* 이미지 URL 수동 추가 버튼 (보조용) */}
            <button 
                onClick={() => {
                    const url = window.prompt('이미지 주소(URL)를 입력하세요');
                    if (url) editor.chain().focus().setImage({ src: url }).run();
                }}
                style={{ ...buttonStyle, fontWeight: 'bold' }}
            >
                📷 이미지
            </button>
        </div>
    );
};

const AUTOSAVE_KEY = 'tiptap-autosave';

const TiptapEditor = () => {
    const [documents, setDocuments] = useState([]);
    const [currentId, setCurrentId] = useState(null);
    const [title, setTitle] = useState('');
    const [isUploading, setIsUploading] = useState(false); // 업로드 상태 관리

    // [핵심] 이미지를 문자열(Base64)로 변환하는 함수
    const uploadImage = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) { reject(null); return; }

            // 800KB 제한 (Firestore 용량 보호)
            if (file.size > 800 * 1024) {
                alert("이미지가 너무 큽니다! (800KB 이하만 가능)");
                setIsUploading(false);
                reject(null);
                return;
            }

            setIsUploading(true);
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const base64String = e.target.result;
                setIsUploading(false);
                resolve(base64String);
            };

            reader.onerror = (error) => {
                console.error("변환 실패:", error);
                setIsUploading(false);
                reject(null);
            };

            reader.readAsDataURL(file);
        });
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            TextStyle,
            FontFamily.configure({ types: ['textStyle'] }),
            Color.configure({ types: ['textStyle'] }),
            Highlight,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image, // [필수] 이미지 기능 등록
        ],
        content: `<p>로딩중...</p>`,
        
        // [핵심] 드래그 앤 드롭 감지
        editorProps: {
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    
                    if (file.type.startsWith('image/')) {
                        uploadImage(file).then((url) => {
                            if (url) {
                                const { schema } = view.state;
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                                view.dispatch(view.state.tr.insert(
                                    coordinates ? coordinates.pos : view.state.selection.from,
                                    schema.nodes.image.create({ src: url })
                                ));
                            }
                        });
                        return true; // 기본 동작 막기
                    }
                }
                return false;
            }
        },

        onUpdate: ({ editor }) => {
            const content = editor.getJSON();
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(content));
        },
    });

    // 2. Firebase에서 글 목록 가져오기
    const fetchDocuments = async () => {
        try {
            const q = query(collection(db, "posts"), orderBy("updatedAt", "desc"));
            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(doc => ({
                id: doc.id, ...doc.data()
            }));
            setDocuments(docs);
        } catch (e) {
            console.error("데이터 로드 실패:", e);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    // 에디터 로드 시 내용 복구
    useEffect(() => {
        if (!editor) return;
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
            try { editor.commands.setContent(JSON.parse(saved)); } catch (e) { console.warn(e); }
        } else {
            editor.commands.setContent(`
                <h2 style="text-align:center;">이미지를 드래그해보세요! 📸</h2>
                <p>이제 별도의 서버 설정 없이 이미지가 저장됩니다.</p>
            `);
        }
    }, [editor]);

    // 3. Firebase 저장 핸들러
    const handleSave = async () => {
        if (!editor) return;
        if (!title.trim()) { alert("제목을 꼭 입력해주세요!"); return; }

        const content = editor.getJSON();
        const now = new Date().toISOString();

        try {
            if (currentId) {
                await updateDoc(doc(db, "posts", currentId), {
                    title: title, content: content, updatedAt: now
                });
                alert('수정되었습니다! ✅');
            } else {
                const docRef = await addDoc(collection(db, "posts"), {
                    title: title, content: content, createdAt: now, updatedAt: now
                });
                setCurrentId(docRef.id);
                alert('새로 저장되었습니다! 🎉');
            }
            fetchDocuments();
            localStorage.removeItem(AUTOSAVE_KEY);
        } catch (e) {
            console.error("저장 에러:", e);
            alert("저장 실패 (혹시 이미지가 너무 큰가요? 1MB 이하만 가능)");
        }
    };

    const handleNew = () => {
        setCurrentId(null);
        setTitle('');
        editor?.commands.setContent('<p></p>');
        editor?.commands.focus();
        localStorage.removeItem(AUTOSAVE_KEY);
    };

    const handleLoad = (doc) => {
        setCurrentId(doc.id);
        setTitle(doc.title);
        editor?.commands.setContent(doc.content);
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(doc.content));
    };

    return (
        <div className="app-container" style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '16px' }}>
            <div style={{ width: '280px', border: '1px solid #ccc', borderRadius: '8px', padding: '16px', height: 'fit-content' }}>
                <h3 style={{ marginTop: 0 }}>📚 서버 저장 목록</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button style={{ flex: 1, padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd' }} onClick={handleNew}>새 글</button>
                    <button style={{ flex: 1, padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #333' }} onClick={handleSave}>저장</button>
                </div>
                <input
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
                <div style={{ maxHeight: '400px', overflowY: 'auto', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    {documents.length === 0 && <p style={{ color: '#777' }}>저장된 글이 없습니다.</p>}
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            onClick={() => handleLoad(doc)}
                            style={{
                                padding: '10px',
                                marginBottom: '6px',
                                borderRadius: '6px',
                                border: doc.id === currentId ? '2px solid #333' : '1px solid #eee',
                                cursor: 'pointer',
                                background: doc.id === currentId ? '#f9f9f9' : '#fff'
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>{doc.title}</div>
                            <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                                {new Date(doc.updatedAt).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="editor-section" style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', minHeight: '400px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ marginTop: 0 }}>📝 Editor (Firebase)</h3>
                    {isUploading && <span style={{ color: 'blue', fontWeight: 'bold' }}>이미지 처리 중... ⏳</span>}
                </div>
                <MenuBar editor={editor} />
                <div style={{ minHeight: '300px', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};

export default TiptapEditor;