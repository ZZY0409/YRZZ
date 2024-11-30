import { useState, useEffect } from 'react';
import { db, COLLECTIONS, MOMENT_FIELDS, COMMENT_FIELDS } from '../../firebase/config.js';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  getDocs, 
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';
import UserAvatar from '../User/UserAvatar';

export default function MomentsList({ onClose }) {
  const [moments, setMoments] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [commenting, setCommenting] = useState(null);
  const [newComment, setNewComment] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const momentsRef = collection(db, COLLECTIONS.MOMENTS);
    const q = query(momentsRef, orderBy(MOMENT_FIELDS.CREATED_AT, 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const momentsList = await Promise.all(
        snapshot.docs.map(async doc => {
          const data = doc.data();
          const userRef = doc(db, COLLECTIONS.USERS, data[MOMENT_FIELDS.USER_ID]);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : null;
          return {
            id: doc.id,
            ...data,
            user: userData
          };
        })
      );
      setMoments(momentsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(images => {
      setSelectedImages(prev => [...prev, ...images].slice(0, 9)); // 最多9张图片
    });
  };

  const handlePost = async () => {
    if (!newPost.trim() && !selectedImages.length) return;

    try {
      await addDoc(collection(db, COLLECTIONS.MOMENTS), {
        [MOMENT_FIELDS.USER_ID]: currentUser.uid,
        [MOMENT_FIELDS.CONTENT]: newPost.trim(),
        [MOMENT_FIELDS.IMAGES]: selectedImages,
        [MOMENT_FIELDS.CREATED_AT]: serverTimestamp(),
        [MOMENT_FIELDS.LIKES]: [],
        [MOMENT_FIELDS.COMMENTS]: []
      });

      setNewPost('');
      setSelectedImages([]);
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败');
    }
  };

  const handleLike = async (momentId) => {
    const momentRef = doc(db, COLLECTIONS.MOMENTS, momentId);
    const moment = moments.find(m => m.id === momentId);
    const hasLiked = moment.likes.includes(currentUser.uid);

    try {
      await updateDoc(momentRef, {
        [MOMENT_FIELDS.LIKES]: hasLiked 
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid)
      });
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleComment = async (momentId) => {
    if (!newComment.trim()) return;

    const momentRef = doc(db, COLLECTIONS.MOMENTS, momentId);
    const comment = {
      [COMMENT_FIELDS.USER_ID]: currentUser.uid,
      [COMMENT_FIELDS.CONTENT]: newComment.trim(),
      [COMMENT_FIELDS.CREATED_AT]: serverTimestamp()
    };

    try {
      await updateDoc(momentRef, {
        [MOMENT_FIELDS.COMMENTS]: arrayUnion(comment)
      });

      setNewComment('');
      setCommenting(null);
    } catch (error) {
      console.error('评论失败:', error);
    }
  };

  return (
    <div className="moments-modal">
      <div className="modal-content">
        <h2>朋友圈</h2>
        <div className="post-form">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="分享新鲜事..."
            maxLength={200}
          />
          <div className="image-upload">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              id="image-input"
            />
            <label htmlFor="image-input">添加图片</label>
            {selectedImages.length > 0 && (
              <div className="image-preview">
                {selectedImages.map((image, index) => (
                  <div key={index} className="preview-item">
                    <img src={image} alt="预览" />
                    <button onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handlePost}>发布</button>
        </div>
        {loading ? (
          <div>加载中...</div>
        ) : (
          <div className="moments-list">
            {moments.map(moment => (
              <div key={moment.id} className="moment-item">
                <div className="moment-header">
                  <UserAvatar userId={moment.userId} size={40} />
                  <div className="moment-info">
                    <div className="user-name">
                      {moment.user?.displayName || '未命名用户'}
                    </div>
                    <div className="post-time">
                      {moment.createdAt?.toDate().toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="moment-content">
                  {moment.content}
                  {moment.images?.length > 0 && (
                    <div className="moment-images">
                      {moment.images.map((image, index) => (
                        <img key={index} src={image} alt="动态图片" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="moment-actions">
                  <button 
                    onClick={() => handleLike(moment.id)}
                    className={moment.likes?.includes(currentUser.uid) ? 'liked' : ''}
                  >
                    {moment.likes?.length || 0} 赞
                  </button>
                  <button onClick={() => setCommenting(moment.id)}>
                    {moment.comments?.length || 0} 评论
                  </button>
                </div>
                {moment.comments?.length > 0 && (
                  <div className="comments-list">
                    {moment.comments.map((comment, index) => (
                      <div key={index} className="comment-item">
                        <UserAvatar userId={comment.userId} size={24} />
                        <div className="comment-content">
                          <div className="comment-text">{comment.content}</div>
                          <div className="comment-time">
                            {comment.createdAt?.toDate().toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {commenting === moment.id && (
                  <div className="comment-form">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="写评论..."
                      maxLength={100}
                    />
                    <button onClick={() => handleComment(moment.id)}>发送</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
} 