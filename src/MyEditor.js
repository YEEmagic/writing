import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';

// [변경됨] 1. Firebase 관련 모듈 import
import { db } from './firebase'; // 1단계에서 만든 firebase.js 파일 경로
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
        </div>
    );
};

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
        content: `<p>로딩중...</p>`,
        onUpdate: ({ editor }) => {
            const content = editor.getJSON();
            // [유지] 타이핑 중에는 로컬 스토리지에 임시 저장 (UX 보호용)
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(content));
        },
    });

    // [추가됨] 2. Firebase에서 글 목록 가져오는 함수
    const fetchDocuments = async () => {
        try {
            // 'posts' 컬렉션에서 날짜 최신순으로 가져오기
            const q = query(collection(db, "posts"), orderBy("updatedAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            const docs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDocuments(docs);
        } catch (e) {
            console.error("Firebase 데이터 로드 실패:", e);
        }
    };

    // 컴포넌트 처음 켜질 때 목록 불러오기
    useEffect(() => {
        fetchDocuments();
    }, []);

    // 에디터 로드 완료 시 로컬 임시저장본 혹은 기본 멘트 띄우기
    useEffect(() => {
        if (!editor) return;
        
        // 만약 임시 저장된 게 있다면 불러오기 (새로고침 대비)
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
            try {
                editor.commands.setContent(JSON.parse(saved));
            } catch (e) {
                console.warn(e);
            }
        } else {
            // 없으면 기본 환영 메시지
            editor.commands.setContent(`
                <h2 style="text-align:center;">안녕하세요! Firebase 연동 에디터입니다.</h2>
                <p>이제 '저장' 버튼을 누르면 서버에 영구 저장됩니다.</p>
            `);
        }
    }, [editor]);


    // [추가됨] 3. Firebase 저장 핸들러
    const handleSave = async () => {
        if (!editor) return;
        if (!title.trim()) {
            alert("제목을 꼭 입력해주세요!");
            return;
        }

        const content = editor.getJSON(); // 에디터 내용을 JSON으로 추출
        const now = new Date().toISOString();

        try {
            if (currentId) {
                // [수정] 이미 저장된 글이면 -> 내용만 업데이트 (Update)
                const docRef = doc(db, "posts", currentId);
                await updateDoc(docRef, {
                    title: title,
                    content: content,
                    updatedAt: now
                });
                alert('수정되었습니다! ✅');
            } else {
                // [신규] 새로운 글이면 -> 새로 만들기 (Create)
                const docRef = await addDoc(collection(db, "posts"), {
                    title: title,
                    content: content,
                    createdAt: now,
                    updatedAt: now
                });
                setCurrentId(docRef.id); // 현재 작업 중인 ID 설정
                alert('새로 저장되었습니다! 🎉');
            }
            
            fetchDocuments(); // 목록 새로고침
            localStorage.removeItem(AUTOSAVE_KEY); // 저장했으니 임시본은 삭제
            
        } catch (e) {
            console.error("저장 에러:", e);
            alert("저장에 실패했습니다. 권한 설정을 확인해보세요.");
        }
    };

    // [추가됨] 4. 새 글 쓰기
    const handleNew = () => {
        setCurrentId(null);
        setTitle('');
        editor?.commands.setContent('<p></p>');
        editor?.commands.focus();
        localStorage.removeItem(AUTOSAVE_KEY);
    };

    // [추가됨] 5. 목록에서 글 불러오기
    const handleLoad = (doc) => {
        setCurrentId(doc.id);
        setTitle(doc.title);
        
        // Tiptap의 강력한 기능: JSON을 넣으면 알아서 HTML로 렌더링해줌
        editor?.commands.setContent(doc.content);
        
        // 불러온 내용으로 임시저장소도 업데이트
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(doc.content));
    };

    return (
        <div className="app-container" style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '16px' }}>
            <div style={{ width: '280px', border: '1px solid #ccc', borderRadius: '8px', padding: '16px', height: 'fit-content' }}>
                <h3 style={{ marginTop: 0 }}>📚 서버 저장 목록</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button style={{ ...{ flex: 1, padding: '6px 8px', cursor: 'pointer', borderRadius: '4px' }, border: '1px solid #ddd' }} onClick={handleNew}>새 글</button>
                    <button style={{ ...{ flex: 1, padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', backgroundColor: '#333', color: '#fff' }, border: '1px solid #333' }} onClick={handleSave}>저장</button>
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
                <h3 style={{ marginTop: 0 }}>📝 Editor (Firebase)</h3>
                <MenuBar editor={editor} />
                <div style={{ minHeight: '300px', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};

export default TiptapEditor;