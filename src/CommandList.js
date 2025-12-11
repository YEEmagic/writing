// src/CommandList.js
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export default forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command(item); // Tiptap에 명령 전달
    }
  };

  // 키보드 이벤트 핸들링 (부모인 Tiptap에서 호출함)
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  // 마우스로 호버했을 때 인덱스 변경
  useEffect(() => setSelectedIndex(0), [props.items]);

  return (
    <div className="items" style={{
      background: 'white',
      borderRadius: '6px',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.1)',
      padding: '5px',
      minWidth: '150px'
    }}>
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`item ${index === selectedIndex ? 'is-selected' : ''}`}
            key={index}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: index === selectedIndex ? '#f3f3f3' : 'transparent',
              border: 'none',
              padding: '8px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {item.title}
          </button>
        ))
      ) : (
        <div className="item" style={{ padding: '8px 10px', color: '#999' }}>결과 없음</div>
      )}
    </div>
  );
});