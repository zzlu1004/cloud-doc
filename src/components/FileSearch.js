import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'

const FileSearch = ({ title, onFileSearch}) => {
  const [ inputActive, setInputActive ] = useState(false)
  const [ value, setValue ] = useState('')
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)

  let node = useRef(null)

  // 关闭搜索框
  const closeSearch = e => {
    setInputActive(false)
    setValue('')
    onFileSearch('')
  }

  // 绑定键盘事件
  useEffect(() => {
    if (enterPressed && inputActive) {
      onFileSearch(value)
    }
    if (escPressed && inputActive) {
      closeSearch(value)
    }

    // const handleInputEvent = event => {
    //   const { keyCode } = event
    //   if (keyCode === 13 && inputActive) {
    //     onFileSearch(value)
    //   } else if (keyCode === 27 && inputActive) {
    //     closeSearch(event)
    //   }
    // }
    // document.addEventListener('keyup', handleInputEvent)
    // return () => {
    //   document.removeEventListener('keyup', handleInputEvent)
    // }
  })

  // 输入框获取焦点
  useEffect(() => {
    inputActive && node.current.focus()
  }, [inputActive])
  return (
    <div className="alert alert-primary d-flex justify-content-between align-items-center mb-0">
      {
        !inputActive && 
        <>
          <span>{title}</span>
          <button type="button" className="icon-button" onClick={() => setInputActive(true)}><FontAwesomeIcon icon={faSearch} title="搜索" size="lg" /></button>
        </>
      }
      {
        inputActive && 
        <>
          <input type="text" className="form-control col-8" ref={node} value={value} onChange={(e) => { setValue(e.target.value) }} />
          <button type="button" className="icon-button col-4" onClick={closeSearch}><FontAwesomeIcon icon={faTimes} title="关闭" size="lg" /></button>
        </>
      }
    </div>
  )
}

// 属性检查
FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired
}
// 默认属性
FileSearch.defaultProps = {
  title: '我的云文档'
}
export default FileSearch